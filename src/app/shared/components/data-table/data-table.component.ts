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
  contentChildren,
  inject,
  signal
} from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { IonCard, IonCardContent } from '@ionic/angular/standalone';
import { map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TableColumn, TablePagination, TableSort } from './interfaces/data-table.models';
import { DataTableCellDirective } from './directives/data-table-cell.directive';
import { TableColumnComponent } from './components/table-column.component';
import { FormControlComponent } from '../form-control/form-control.component';
import { InputControlType } from '../input-control/input-control.component';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
    FormControlComponent,
    MatTableModule,
    MatSortModule,
    IonCard,
    IonCardContent
  ],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent<T = any> {
  // === Data & Column Inputs ===
  @Input() columns: TableColumn<T>[] = [];
  @Input() data: T[] = [];
  @Input() trackBy: string | keyof T | ((item: T) => any) = 'id';

  // === Mode & Form Configuration ===
  @Input() mode: 'list' | 'editable' = 'list';
  @Input() formArray?: FormArray;
  @Input() canEdit = false;

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
  /** Current sort as the list URL keeps it: "field" (asc) or "-field" (desc). Shows the header arrow after reload/Back. */
  @Input() set sort(v: string | null | undefined) {
    this.currentSort.set(v ? { column: v.replace(/^-/, ''), direction: v.startsWith('-') ? 'desc' : 'asc' } : null);
  }
  @Output() sortChange = new EventEmitter<TableSort>();
  @Output() selectionChange = new EventEmitter<T[]>();
  @Output() pageChange = new EventEmitter<{ pageIndex: number; pageSize: number }>();

  // === Reactive State (Signals) ===
  public selectedRows = signal<T[]>([]);
  public currentSort = signal<TableSort | null>(null);

  // Template projections
  @ContentChildren(DataTableCellDirective)
  private customCells!: QueryList<DataTableCellDirective>;

  // Declarative Column Children (Angular Signal Query)
  public columnChildren = contentChildren(TableColumnComponent);

  /**
   * Computed effective columns list:
   * Uses projected <app-column> components when present, otherwise falls back to the columns input.
   */
  public effectiveColumns = computed<TableColumn[]>(() => {
    const children = this.columnChildren();
    if (children && children.length > 0) {
      return children.filter(c => c.visible !== false) as unknown as TableColumn[];
    }
    return this.columns;
  });

  /**
   * Determines if the table is currently in interactive edit mode.
   */
  public get isEditActive(): boolean {
    return this.canEdit || this.mode === 'editable';
  }

  /**
   * Total number of rendered columns including utility columns.
   */
  public totalColumnCount = computed(() => {
    let count = this.effectiveColumns().length;
    if (this.selectable) count++;
    if (this.showIndex) count++;
    return count;
  });

  /**
   * Lookup custom cell template registered for the specified column key or column component.
   */
  public getCellTemplate(col: TableColumn | TableColumnComponent, isEdit: boolean): TemplateRef<any> | null {
    const c = col as any;
    if (isEdit && c.editTemplate) {
      return c.editTemplate;
    }
    if (!isEdit && c.viewTemplate) {
      return c.viewTemplate;
    }
    if (c.cellTemplate) {
      return c.cellTemplate;
    }
    return this.getCustomTemplate(col.key);
  }

  /**
   * Legacy lookup for DataTableCellDirective.
   */
  public getCustomTemplate(key: string): TemplateRef<any> | null {
    if (!this.customCells) return null;
    const match = this.customCells.find(c => c.columnKey === key);
    return match ? match.templateRef : null;
  }

  /**
   * Resolves the appropriate InputControlType for auto-rendered form controls.
   */
  public getControlType(col: TableColumn | TableColumnComponent): InputControlType {
    if (col.controlType) return col.controlType;
    if (col.type === 'currency') return 'currency';
    if (col.type === 'number') return 'number';
    if (col.type === 'date') return 'date';
    return 'text';
  }

  /**
   * Checks whether the given form group has a control registered with key.
   */
  public hasFormControl(ctrl: any, key: string): boolean {
    return !!(ctrl && typeof ctrl.get === 'function' && ctrl.get(key));
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
    if (target.closest('button, input, select, a, app-async-select, app-custom-select, .erpm-btn')) {
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

  // =========================================================================
  // Material table (desktop) and cards (phone)
  // =========================================================================

  /** Phone width: the list view switches to Ionic cards. */
  public isPhone = toSignal(
    inject(BreakpointObserver).observe('(max-width: 767.98px)').pipe(map(r => r.matches)), { initialValue: false });

  /** Material table only renders plain data; loading, empty and inline-edit keep the original markup. */
  public get useMaterial(): boolean { return !this.loading && !this.isEditActive && this.data.length > 0 && !this.isPhone(); }
  public get useCards(): boolean { return !this.loading && !this.isEditActive && this.data.length > 0 && this.isPhone(); }

  /** Material column ids: utility columns first, then the declared ones. */
  public matColumnKeys = computed(() => [
    ...(this.selectable ? ['__select'] : []),
    ...(this.showIndex ? ['__index'] : []),
    ...this.effectiveColumns().map(c => c.key)
  ]);

  /**
   * Column kind drives one shared width rule (see the data-kind rules in the stylesheet), so no screen sets its own
   * widths: the width/minWidth a screen declares only applies to the loading, empty and inline-edit layout.
   */
  public colKind(col: TableColumn<T> | TableColumnComponent): 'actions' | 'status' | 'date' | 'number' | 'code' | 'text' {
    if (col.key === 'actions' || col.type === 'actions') return 'actions';
    if (col.type === 'badge' || col.key === 'status') return 'status';
    if (col.type === 'date') return 'date';
    if (col.type === 'number' || col.type === 'currency') return 'number';
    if (/^code$|Code$|Number$/.test(col.key)) return 'code';
    return 'text';
  }

  public matTrackBy = (index: number, row: T): any => this.getRowTrackId(row, index);

  private sortedFor?: { data: T[]; sort: TableSort | null; rows: T[] };

  /**
   * Rows in display order. The table sorts the rows it was given when the host does not listen to
   * (sortChange); a host that listens sorts on the server. Empty values stay last in both directions.
   */
  public get viewRows(): T[] {
    const sort = this.currentSort();
    if (!sort || this.sortChange.observed) return this.data;
    if (this.sortedFor?.data === this.data && this.sortedFor.sort === sort) return this.sortedFor.rows;
    const dir = sort.direction === 'asc' ? 1 : -1;
    const rows = [...this.data].sort((a, b) => compareCells(this.getCellValue(a, sort.column), this.getCellValue(b, sort.column), dir));
    this.sortedFor = { data: this.data, sort, rows };
    return rows;
  }

  public onMatSort(sort: Sort): void {
    const next: TableSort | null = sort.direction ? { column: sort.active, direction: sort.direction } : null;
    this.currentSort.set(next);
    if (next) this.sortChange.emit(next);
  }
}

/** Numbers compare as numbers, everything else as text in the user locale; empty values stay last in both directions. */
function compareCells(a: unknown, b: unknown, dir: number): number {
  const emptyA = a == null || a === '', emptyB = b == null || b === '';
  if (emptyA || emptyB) return emptyA === emptyB ? 0 : emptyA ? 1 : -1;
  if (typeof a === 'number' && typeof b === 'number') return dir * (a - b);
  return dir * String(a).localeCompare(String(b), undefined, { numeric: true });
}
