import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrgBranch, OrgUnitType } from '../../../core/models/org.models';
import { branchIndex, branchPath } from '../../../core/models/org-tree.util';

interface Crumb { id: number; label: string; company: boolean; }

/**
 * Where an organization node sits. The cell shows the node name (with its parent as a muted hint); hovering or
 * focusing it opens a popover listing every level from the root down, indented, like the old ERP's collapsed
 * breadcrumb. The popover is fixed-positioned so scrolling table containers cannot clip it. The tree index is cached
 * per tree array, so a table of rows sharing one `tree` costs one pass in total.
 */
@Component({
  selector: 'app-branch-breadcrumbs',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './branch-breadcrumbs.component.html',
  styleUrls: ['./branch-breadcrumbs.component.scss']
})
export class BranchBreadcrumbsComponent {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private _tree = signal<readonly OrgBranch[]>([]);
  private _branchId = signal<number | null>(null);
  private _skipGroup = signal(false);

  public open = signal(false);
  public popTop = signal(0);
  public popLeft = signal(0);

  /** Nested tree of GET /branches/tree; share one array between rows. */
  @Input() set tree(value: readonly OrgBranch[] | null | undefined) { this._tree.set(value ?? []); }
  @Input() set branchId(value: number | null | undefined) { this._branchId.set(value ?? null); this.open.set(false); }
  /** Leave the group root out of the popover (it is the same for everybody). */
  @Input() set skipGroup(value: boolean) { this._skipGroup.set(value); }

  /** Full path, top to bottom. */
  public path = computed<Crumb[]>(() => {
    const nodes = branchPath(branchIndex(this._tree()), this._branchId());
    const shown = this._skipGroup() && nodes.length > 1 ? nodes.filter(n => n.orgUnitType !== OrgUnitType.Group) : nodes;
    return shown.map(n => ({ id: n.id, label: n.name, company: n.orgUnitType === OrgUnitType.Company }));
  });

  public leaf = computed(() => this.path().at(-1) ?? null);
  /** Direct parent shown as a muted hint next to the name, when the path has more than one level. */
  public parentHint = computed(() => this.path().length > 1 ? this.path().at(-2)!.label : '');
  public fullText = computed(() => this.path().map(c => c.label).join(' › '));

  public show(): void {
    if (this.path().length === 0) return;
    const rect = this.host.nativeElement.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom > 220;
    this.popTop.set(below ? rect.bottom + 4 : Math.max(8, rect.top - 4 - this.path().length * 30 - 16));
    this.popLeft.set(Math.min(rect.left, window.innerWidth - 280));
    this.open.set(true);
  }

  public hide(): void { this.open.set(false); }

  public toggle(event: Event): void {
    event.stopPropagation();
    if (this.open()) this.hide(); else this.show();
  }

  @HostListener('document:keydown.escape') onEscape(): void { this.hide(); }
  @HostListener('window:scroll') onScroll(): void { if (this.open()) this.hide(); }
}
