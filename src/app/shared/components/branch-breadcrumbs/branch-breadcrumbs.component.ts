import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrgBranch, OrgUnitType } from '../../../core/models/org.models';
import { branchIndex, branchPath } from '../../../core/models/org-tree.util';

interface Crumb { id: number; label: string; company: boolean; }

/**
 * Where an organization node sits: "Company A › Ha Noi branch › Store 01". Read-only counterpart of
 * <app-branch-select>. Long paths collapse to the first and last items around a "…" button that reveals the whole
 * path. The tree index is cached per tree array, so a table of rows sharing one `tree` costs one pass in total.
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
  private _tree = signal<readonly OrgBranch[]>([]);
  private _branchId = signal<number | null>(null);
  private _maxItems = signal(3);
  private _before = signal(1);
  private _after = signal(1);
  private _skipGroup = signal(true);
  public expanded = signal(false);

  /** Nested tree of GET /branches/tree; share one array between rows. */
  @Input() set tree(value: readonly OrgBranch[] | null | undefined) { this._tree.set(value ?? []); }
  @Input() set branchId(value: number | null | undefined) { this._branchId.set(value ?? null); this.expanded.set(false); }
  /** Collapse when the path has more items than this. */
  @Input() set maxItems(value: number) { this._maxItems.set(Math.max(2, value)); }
  @Input() set itemsBeforeCollapse(value: number) { this._before.set(Math.max(1, value)); }
  @Input() set itemsAfterCollapse(value: number) { this._after.set(Math.max(1, value)); }
  /** The group root is the same for everybody, so it is left out unless this is false. */
  @Input() set skipGroup(value: boolean) { this._skipGroup.set(value); }

  /** Full path, top to bottom. */
  public path = computed<Crumb[]>(() => {
    const nodes = branchPath(branchIndex(this._tree()), this._branchId());
    const shown = this._skipGroup() && nodes.length > 1 ? nodes.filter(n => n.orgUnitType !== OrgUnitType.Group) : nodes;
    return shown.map(n => ({ id: n.id, label: n.name, company: n.orgUnitType === OrgUnitType.Company }));
  });

  public fullText = computed(() => this.path().map(c => c.label).join(' › '));

  /** What is drawn: the whole path, or first items + a collapse marker + last items. */
  public view = computed(() => {
    const path = this.path();
    const collapsible = path.length > this._maxItems();
    if (!collapsible || this.expanded()) return { head: path, hidden: 0, tail: [] as Crumb[], collapsible };
    return { head: path.slice(0, this._before()), hidden: path.length - this._before() - this._after(), tail: path.slice(path.length - this._after()), collapsible };
  });

  public toggle(event: Event): void {
    event.stopPropagation();
    this.expanded.update(open => !open);
  }
}
