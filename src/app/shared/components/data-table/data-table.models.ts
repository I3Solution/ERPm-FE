/**
 * Core type definitions and contracts for enterprise DataTable component.
 */

export type ColumnAlign = 'left' | 'center' | 'right';

export type ColumnType =
  | 'text'        // Standard text rendering
  | 'number'      // Formatted number with decimal precision
  | 'currency'    // Formatted monetary amount with non-breaking currency symbol
  | 'date'        // Date or datetime string
  | 'badge'       // Status badge mapped through badgeMap
  | 'actions'     // Action buttons column
  | 'custom';     // Custom template rendered via DataTableCellDirective

export interface TableBadgeConfig {
  label?: string;
  class: string;
}

export interface TableColumn<T = any> {
  key: string;
  label: string;
  width?: string;
  minWidth?: string;
  align?: ColumnAlign;
  type?: ColumnType;
  sortable?: boolean;
  sticky?: 'left' | 'right';
  badgeMap?: Record<string, TableBadgeConfig>;
  nowrap?: boolean;
  dateFormat?: string; // e.g. 'dd/MM/yyyy' or 'dd/MM/yyyy HH:mm'
  numberFormat?: string; // e.g. '1.0-0' or '1.2-2'
}

export interface TableSort {
  column: string;
  direction: 'asc' | 'desc';
}

export interface TablePagination {
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions?: number[];
}
