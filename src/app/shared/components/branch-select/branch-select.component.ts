import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, ViewChild,
  computed, forwardRef, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { OrgBranch, OrgUnitType } from '../../../core/models/org.models';
import { TranslatePipe } from '../../pipes/translate.pipe';

/** Indexed tree node: built once per input change, then every lookup is O(1). */
interface IndexedNode {
  branch: OrgBranch;
  parentId: number | null;
  depth: number;
  childIds: number[];
  searchText: string;
  selectable: boolean;
}

/** One rendered row of the flattened, currently visible part of the tree. */
export interface BranchRow { id: number; branch: OrgBranch; depth: number; hasChildren: boolean; expanded: boolean; selectable: boolean; }

const ICONS: Record<OrgUnitType, string> = { [OrgUnitType.Group]: '🏛️', [OrgUnitType.Company]: '🏢', [OrgUnitType.Branch]: '🏬' };
const SEARCH_DEBOUNCE_MS = 200;

/**
 * Picks one node of the organization tree (group > company > branch). Takes the nested tree of GET /branches/tree
 * directly. Performance: the id index is built once per input change; only nodes under expanded parents are walked
 * and rendered; the panel exists in the DOM only while open; typing is debounced. Looks like <app-custom-select>
 * because it shares its stylesheet (tokens, dark mode) and class names.
 * While open the panel is moved to <body> and positioned with `position: fixed` under (or above) the trigger, so a
 * modal's `overflow: hidden` cannot clip the tall tree.
 */
@Component({
  selector: 'app-branch-select',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './branch-select.component.html',
  styleUrls: ['../custom-select/custom-select.component.scss', './branch-select.component.scss'],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => BranchSelectComponent), multi: true }]
})
export class BranchSelectComponent implements ControlValueAccessor, OnDestroy {
  private detector = inject(ChangeDetectorRef);
  private host = inject(ElementRef<HTMLElement>);

  @Input() inputId = '';
  @Input() placeholder = '';
  @Input() allowClear = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() minWidth = '180px';
  @Input() disabled = false;

  /** Nested tree as returned by GET /branches/tree. */
  @Input() set tree(value: OrgBranch[] | null | undefined) { this._tree.set(value ?? []); }
  /** Node types the user may pick; other nodes are shown but locked. Null allows every type. */
  @Input() set nodeTypeFilter(value: readonly OrgUnitType[] | null | undefined) { this._types.set(value && value.length > 0 ? value : null); }
  /** Restricts the visible tree to this node (with `scopeMode = 'selfAndChildren'`). */
  @Input() set scopeRootId(value: number | null | undefined) { this._scopeRootId.set(value ?? null); }
  @Input() set scopeMode(value: 'all' | 'selfAndChildren') { this._scopeMode.set(value ?? 'all'); }
  /** Hides this node and everything below it (e.g. the possible parents of a node being edited). */
  @Input() set excludeSubtreeOf(value: number | null | undefined) { this._excluded.set(value ?? null); }

  @Input() set value(val: number | null) { this.current.set(val ?? null); }
  get value(): number | null { return this.current(); }

  @Output() valueChange = new EventEmitter<number | null>();
  @Output() selectionChange = new EventEmitter<OrgBranch | null>();
  @Output() change = new EventEmitter<number | null>();

  private _tree = signal<OrgBranch[]>([]);
  private _types = signal<readonly OrgUnitType[] | null>(null);
  private _scopeRootId = signal<number | null>(null);
  private _scopeMode = signal<'all' | 'selfAndChildren'>('all');
  private _excluded = signal<number | null>(null);

  public current = signal<number | null>(null);
  public isOpen = signal(false);
  public searchRaw = signal('');
  private search = signal('');
  private expanded = signal<ReadonlySet<number>>(new Set());
  public activeId = signal<number | null>(null);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private panelEl: HTMLElement | null = null;
  private readonly reposition = () => { if (this.panelEl) this.placePanel(this.panelEl); };

  /** Called when the panel is created or destroyed by the `@if`; moves it to <body> and starts following the trigger. */
  @ViewChild('panel') set panel(ref: ElementRef<HTMLElement> | undefined) {
    if (!ref) { this.detachPanel(); return; }
    if (this.panelEl === ref.nativeElement) return;
    this.panelEl = ref.nativeElement;
    document.body.appendChild(this.panelEl);
    this.placePanel(this.panelEl);
    window.addEventListener('resize', this.reposition);
    document.addEventListener('scroll', this.reposition, true);
    this.panelEl.querySelector<HTMLInputElement>('.dropdown-search-input')?.focus();
  }

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  /** Recomputed only when the tree or a restricting input changes; never while typing or expanding. */
  private index = computed(() => {
    const byId = new Map<number, OrgBranch>();
    const stack = [...this._tree()];
    while (stack.length > 0) { const b = stack.pop()!; byId.set(b.id, b); for (const c of b.children ?? []) stack.push(c); }

    const types = this._types();
    const excluded = this._excluded();
    const nodes = new Map<number, IndexedNode>();
    const roots: number[] = [];
    const add = (branch: OrgBranch, parentId: number | null, depth: number) => {
      if (branch.id === excluded) return;
      nodes.set(branch.id, {
        branch, parentId, depth, childIds: [], searchText: `${branch.name} ${branch.code}`.toLowerCase(),
        selectable: !types || types.includes(branch.orgUnitType)
      });
      if (parentId === null) roots.push(branch.id); else nodes.get(parentId)!.childIds.push(branch.id);
      for (const child of branch.children ?? []) add(child, branch.id, depth + 1);
    };
    const rootId = this._scopeRootId();
    if (this._scopeMode() === 'selfAndChildren') {
      // Scoped to one node and its subtree; without a (known) root nothing can be picked yet.
      const scoped = rootId === null ? undefined : byId.get(rootId);
      if (scoped) add(scoped, null, 0);
    } else {
      for (const top of this._tree()) add(top, null, 0);
    }
    return { byId, nodes, roots };
  });

  /** Ids that match the (debounced) search term plus all their ancestors; null when no search is active. */
  private visibleBySearch = computed<ReadonlySet<number> | null>(() => {
    const term = this.search();
    if (!term) return null;
    const { nodes } = this.index();
    const keep = new Set<number>();
    for (const [id, node] of nodes) {
      if (!node.searchText.includes(term)) continue;
      for (let cursor: number | null = id; cursor !== null && !keep.has(cursor); cursor = nodes.get(cursor)?.parentId ?? null) keep.add(cursor);
    }
    return keep;
  });

  /** The visible rows only: children of collapsed nodes are never visited. While searching, matches and their ancestors show opened. */
  public rows = computed<BranchRow[]>(() => {
    const { nodes, roots } = this.index();
    const open = this.expanded();
    const keep = this.visibleBySearch();
    const out: BranchRow[] = [];
    const stack: number[] = [...roots].reverse();
    while (stack.length > 0) {
      const id = stack.pop()!;
      if (keep && !keep.has(id)) continue;
      const node = nodes.get(id)!;
      const childIds = keep ? node.childIds.filter(c => keep.has(c)) : node.childIds;
      const expanded = keep ? childIds.length > 0 : open.has(id);
      out.push({ id, branch: node.branch, depth: node.depth, hasChildren: childIds.length > 0, expanded, selectable: node.selectable });
      if (expanded) for (let i = childIds.length - 1; i >= 0; i--) stack.push(childIds[i]);
    }
    return out;
  });

  public selected = computed<OrgBranch | null>(() => {
    const id = this.current();
    return id === null ? null : this.index().byId.get(id) ?? null;
  });

  public isSearching = computed(() => this.search() !== '');
  public iconOf(type: OrgUnitType): string { return ICONS[type] ?? ''; }
  public trackRow(_: number, row: BranchRow): number { return row.id; }

  // ----- ControlValueAccessor -----
  writeValue(value: number | null): void { this.current.set(value ?? null); this.detector.markForCheck(); }
  registerOnChange(fn: (value: number | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; this.detector.markForCheck(); }

  // ----- Open / close -----
  public toggle(event: Event): void {
    event.stopPropagation();
    if (this.disabled) return;
    if (this.isOpen()) this.close(); else this.open();
  }

  private open(): void {
    this.searchRaw.set('');
    this.search.set('');
    this.expanded.set(this.initialExpansion());
    this.activeId.set(this.current());
    this.isOpen.set(true);
  }

  private close(): void {
    this.isOpen.set(false);
    this.cancelTimer();
    this.onTouched();
  }

  /** Roots plus the ancestors of the selected node, so the selection is visible and everything else stays collapsed. */
  private initialExpansion(): ReadonlySet<number> {
    const { nodes, roots } = this.index();
    const open = new Set<number>(roots);
    for (let cursor = nodes.get(this.current() ?? -1)?.parentId ?? null; cursor !== null; cursor = nodes.get(cursor)?.parentId ?? null) open.add(cursor);
    return open;
  }

  public toggleNode(row: BranchRow, event: Event): void {
    event.stopPropagation();
    if (this.isSearching()) return;
    this.expanded.update(set => { const next = new Set(set); if (!next.delete(row.id)) next.add(row.id); return next; });
  }

  // ----- Search (debounced) -----
  public onSearchInput(text: string): void {
    this.searchRaw.set(text);
    this.cancelTimer();
    this.searchTimer = setTimeout(() => { this.search.set(text.trim().toLowerCase()); this.searchTimer = null; }, SEARCH_DEBOUNCE_MS);
  }

  public clearSearch(): void { this.cancelTimer(); this.searchRaw.set(''); this.search.set(''); }

  private detachPanel(): void {
    if (!this.panelEl) return;
    window.removeEventListener('resize', this.reposition);
    document.removeEventListener('scroll', this.reposition, true);
    // The panel lives under <body>, so destroying the component (modal closed, route changed) would leave it behind.
    this.panelEl.remove();
    this.panelEl = null;
  }

  /** Fixed position under the trigger, or above it when there is more room there; the list height follows the room left. */
  private placePanel(panel: HTMLElement): void {
    const trigger = this.host.nativeElement.querySelector('.custom-select-trigger') as HTMLElement | null;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const gap = 6;
    const below = window.innerHeight - rect.bottom - gap;
    const above = rect.top - gap;
    const openBelow = below >= 260 || below >= above;
    const room = Math.max(120, (openBelow ? below : above) - 56); // 56px: the search box
    const width = Math.max(rect.width, 260);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const style = panel.style;
    style.position = 'fixed';
    style.zIndex = '21000';
    style.left = `${left}px`;
    style.width = `${width}px`;
    style.minWidth = `${width}px`;
    style.setProperty('--bs-list-max', `${Math.min(340, room)}px`);
    if (openBelow) { style.top = `${rect.bottom + 4}px`; style.bottom = 'auto'; }
    else { style.bottom = `${window.innerHeight - rect.top + 4}px`; style.top = 'auto'; }
  }

  private cancelTimer(): void { if (this.searchTimer !== null) { clearTimeout(this.searchTimer); this.searchTimer = null; } }

  // ----- Selection -----
  public select(row: BranchRow, event: Event): void {
    event.stopPropagation();
    if (!row.selectable) return;
    this.commit(row.id, row.branch);
    this.close();
  }

  public clear(event: Event): void {
    event.stopPropagation();
    if (this.disabled) return;
    this.commit(null, null);
  }

  private commit(id: number | null, branch: OrgBranch | null): void {
    this.current.set(id);
    this.onChange(id);
    this.onTouched();
    this.valueChange.emit(id);
    this.selectionChange.emit(branch);
    this.change.emit(id);
  }

  // ----- Keyboard -----
  @HostListener('keydown', ['$event'])
  public onKey(event: KeyboardEvent): void {
    if (this.disabled) return;
    const rows = this.rows();
    const pickable = rows.filter(r => r.selectable);
    const index = pickable.findIndex(r => r.id === this.activeId());
    switch (event.key) {
      case 'ArrowDown': case 'ArrowUp': {
        event.preventDefault();
        if (!this.isOpen()) { this.open(); return; }
        const next = event.key === 'ArrowDown' ? Math.min(pickable.length - 1, index + 1) : Math.max(0, index - 1);
        this.activeId.set(pickable[next]?.id ?? null);
        break;
      }
      case 'ArrowRight': case 'ArrowLeft': {
        const row = rows.find(r => r.id === this.activeId());
        if (this.isOpen() && row && row.hasChildren && !this.isSearching() && row.expanded !== (event.key === 'ArrowRight')) this.toggleNode(row, event);
        break;
      }
      case 'Enter': {
        if ((event.target as HTMLElement).tagName === 'BUTTON') return;
        event.preventDefault();
        if (!this.isOpen()) this.open();
        else { const row = rows.find(r => r.id === this.activeId() && r.selectable); if (row) this.select(row, event); }
        break;
      }
      case 'Escape':
        if (this.isOpen()) this.close();
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.host.nativeElement.contains(event.target)) this.close();
  }

  ngOnDestroy(): void { this.cancelTimer(); this.detachPanel(); }
}
