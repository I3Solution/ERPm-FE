import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  Output,
  QueryList,
  TemplateRef,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { TableColumn, TablePagination, TableSort } from './data-table.models';
import { DataTableCellDirective } from './data-table-cell.directive';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent<T = any> {
  // === Data & Column Inputs ===
  @Input({ required: true }) columns: TableColumn<T>[] = [];
  @Input() data: T[] = [];
  @Input() trackBy: keyof T | ((item: T) => any) = 'id';

  // === Mode & Form Configuration ===
  @Input() mode: 'list' | 'editable' = 'list';
  @Input() formArray?: FormArray;

  // === Features & Interactions ===
  @Input() selectable = false;
  @Input() showIndex = true;
  @Input() clickableRows = false;
  @Input() loading = false;
  @Input() emptyMessage = 'common.empty';

  // === Dimensions & Layout Controls ===
  @Input() tableMinWidth = '1100px';
  @Input() minHeight = '360px';
  @Input() paddingBottom = '0px';

  // === Pagination ===
  @Input() pagination?: TablePagination;

  // === Events & Outputs ===
  @Output() rowClick = new EventEmitter<T>();
  @Output() sortChange = new EventEmitter<TableSort>();
  @Output() selectionChange = new EventEmitter<T[]>();
  @Output() pageChange = new EventEmitter<{ pageIndex: number; pageSize: number }>();

  // === Reactive State (Signals) ===
  public selectedRows = signal<T[]>([]);
  public currentSort = signal<TableSort | null>(null);

  // Template projections
  @ContentChildren(DataTableCellDirective)
  private customCells!: QueryList<DataTableCellDirective>;

  /**
   * Total number of rendered columns including utility columns.
   */
  public totalColumnCount = computed(() => {
    let count = this.columns.length;
    if (this.selectable) count++;
    if (this.showIndex) count++;
    return count;
  });

  /**
   * Lookup custom cell template registered for the specified column key.
   */
  public getCustomTemplate(key: string): TemplateRef<any> | null {
    if (!this.customCells) return null;
    const match = this.customCells.find(c => c.columnKey === key);
    return match ? match.templateRef : null;
  }

  /**
   * Safe value resolver supporting dot-notation property paths (e.g. 'partner.name').
   */
  public getCellValue(row: any, path: string): any {
    if (!row || !path) return '';
    if (!path.includes('.')) return row[path] ?? '';
    const parts = path.split('.');
    let cur = row;
    for (const p of parts) {
      if (cur === null || cur === undefined) return '';
      cur = cur[p];
    }
    return cur ?? '';
  }

  /**
   * Calculates the display row index taking pagination into account.
   */
  public calculateRowIndex(localIndex: number): number {
    if (this.pagination) {
      return this.pagination.pageIndex * this.pagination.pageSize + localIndex + 1;
    }
    return localIndex + 1;
  }

  /**
   * Row trackBy identifier.
   */
  public getRowTrackId(row: T, index: number): any {
    if (typeof this.trackBy === 'function') {
      return this.trackBy(row);
    }
    const key = this.trackBy as keyof T;
    return row && row[key] !== undefined ? row[key] : index;
  }

  // =========================================================================
  // Selection Handlers
  // =========================================================================

  public isRowSelected(row: T): boolean {
    const list = this.selectedRows();
    const idKey = typeof this.trackBy === 'string' ? (this.trackBy as keyof T) : ('id' as keyof T);
    return list.some(item => (item[idKey] !== undefined && item[idKey] === row[idKey]) || item === row);
  }

  public isAllSelected(): boolean {
    return this.data.length > 0 && this.selectedRows().length === this.data.length;
  }

  public isPartiallySelected(): boolean {
    const count = this.selectedRows().length;
    return count > 0 && count < this.data.length;
  }

  public toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedRows.set([...this.data]);
    } else {
      this.selectedRows.set([]);
    }
    this.selectionChange.emit(this.selectedRows());
  }

  public toggleRowSelection(row: T, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const idKey = typeof this.trackBy === 'string' ? (this.trackBy as keyof T) : ('id' as keyof T);
    let next: T[];
    if (checked) {
      next = [...this.selectedRows(), row];
    } else {
      next = this.selectedRows().filter(
        item => (item[idKey] !== undefined ? item[idKey] !== row[idKey] : item !== row)
      );
    }
    this.selectedRows.set(next);
    this.selectionChange.emit(next);
  }

  public onRowClick(row: T, event: MouseEvent): void {
    if (!this.clickableRows) return;
    // Ignore click if clicking on an interactive control (input, button, select, a)
    const target = event.target as HTMLElement;
    if (target.closest('button, input, select, a, app-async-select, .erpm-btn')) {
      return;
    }
    this.rowClick.emit(row);
  }

  // =========================================================================
  // Sorting Handlers
  // =========================================================================

  public onHeaderClick(col: TableColumn<T>): void {
    if (!col.sortable) return;
    const cur = this.currentSort();
    let nextDirection: 'asc' | 'desc' = 'asc';
    if (cur && cur.column === col.key) {
      nextDirection = cur.direction === 'asc' ? 'desc' : 'asc';
    }
    const nextSort: TableSort = { column: col.key, direction: nextDirection };
    this.currentSort.set(nextSort);
    this.sortChange.emit(nextSort);
  }

  // =========================================================================
  // Status Badge Helpers
  // =========================================================================

  public getBadgeClass(col: TableColumn<T>, row: T): string {
    const val = String(this.getCellValue(row, col.key) || '');
    if (col.badgeMap && col.badgeMap[val]) {
      return col.badgeMap[val].class;
    }
    return 'badge-neutral';
  }

  public getBadgeLabel(col: TableColumn<T>, row: T): string {
    const val = String(this.getCellValue(row, col.key) || '');
    if (col.badgeMap && col.badgeMap[val]?.label) {
      return col.badgeMap[val].label!;
    }
    return val;
  }

  // =========================================================================
  // Pagination Handlers
  // =========================================================================

  public getTotalPages(): number {
    if (!this.pagination || this.pagination.pageSize <= 0) return 1;
    return Math.ceil(this.pagination.totalItems / this.pagination.pageSize) || 1;
  }

  public onPageChange(newPageIndex: number): void {
    if (!this.pagination) return;
    if (newPageIndex < 0 || newPageIndex >= this.getTotalPages()) return;
    this.pageChange.emit({
      pageIndex: newPageIndex,
      pageSize: this.pagination.pageSize
    });
  }
}
