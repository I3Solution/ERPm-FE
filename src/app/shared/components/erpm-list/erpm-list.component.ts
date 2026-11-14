import { BreakpointObserver } from '@angular/cdk/layout';
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, contentChildren, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { IonCard, IonCardContent } from '@ionic/angular/standalone';
import { map } from 'rxjs';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TableColumnComponent } from '../data-table/table-column.component';
import { TableSort } from '../data-table/data-table.models';

/**
 * Shared list: Material table core on desktop (mat-table + matSort), Ionic cards on phones.
 * Columns are declared with <app-column> children (same API as app-data-table). The column with
 * key "actions" is pinned to the right edge. Material is allowed only inside this component.
 *
 * Sorting is local (on the rows given) unless serverSort is true; in both cases sortChange fires so the
 * host can keep the sort in the URL. Paging and filters stay with the host (app-list-page).
 */
@Component({
  selector: 'erpm-list',
  standalone: true,
  imports: [NgTemplateOutlet, MatTableModule, MatSortModule, IonCard, IonCardContent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './erpm-list.component.html',
  styleUrls: ['./erpm-list.component.scss']
})
export class ErpmListComponent {
  public readonly data = input<any[]>([]);
  public readonly loading = input(false);
  public readonly clickableRows = input(false);
  /** Current sort as "field" (asc) or "-field" (desc), same format as the list URL state. */
  public readonly sort = input<string | null>(null);
  /** True when the host sorts on the server: the list then keeps row order as given. */
  public readonly serverSort = input(false);

  public readonly rowClick = output<any>();
  public readonly sortChange = output<TableSort>();

  public readonly columns = contentChildren(TableColumnComponent);
  protected readonly visibleColumns = computed(() => this.columns().filter(c => c.visible !== false));
  protected readonly columnKeys = computed(() => this.visibleColumns().map(c => c.key));
  protected readonly actionsKey = 'actions';

  private readonly localSort = signal<Sort | null>(null);
  protected readonly activeSort = computed<Sort>(() => {
    const local = this.localSort();
    if (local) return local;
    const s = this.sort();
    return s ? { active: s.replace(/^-/, ''), direction: s.startsWith('-') ? 'desc' : 'asc' } : { active: '', direction: '' };
  });

  protected readonly isPhone = toSignal(
    inject(BreakpointObserver).observe('(max-width: 767.98px)').pipe(map(r => r.matches)), { initialValue: false });

  protected readonly rows = computed(() => {
    const { active, direction } = this.activeSort();
    const rows = this.data();
    if (this.serverSort() || !active || !direction) return rows;
    const dir = direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => dir * compare(a?.[active], b?.[active]));
  });

  protected onSort(sort: Sort): void {
    this.localSort.set(sort);
    this.sortChange.emit({ column: sort.active, direction: sort.direction === 'desc' ? 'desc' : 'asc' });
  }

  protected onRow(row: any, event: Event): void {
    // Clicks on buttons and links inside a row belong to them, not to the row.
    if (!this.clickableRows() || (event.target as HTMLElement).closest('button, a, input, select, .erpm-btn')) return;
    this.rowClick.emit(row);
  }
}

/** Numbers compare as numbers, everything else as text in the user locale; empty values go last. */
function compare(a: unknown, b: unknown): number {
  if (a == null || a === '') return b == null || b === '' ? 0 : 1;
  if (b == null || b === '') return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}
