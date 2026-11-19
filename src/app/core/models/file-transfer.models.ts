/** Validation or parsing error for a single imported spreadsheet row. */
export interface ImportRowError {
  rowNumber: number;
  column: string | null;
  errorCode: string;
  message: string;
}

/** Aggregated result returned by BE IExcelImportService endpoints. */
export interface ImportResult<T> {
  totalRows: number;
  validCount: number;
  errorCount: number;
  isSuccess: boolean;
  items: T[];
  errors: ImportRowError[];
}

/** Standard backend API envelope matching ERPm.Application.Common.ApiResponse<T>. */
export interface TransferApiResponse<T> {
  success: boolean;
  message?: string | null;
  errorCode?: string | null;
  data?: T | null;
  errors?: string[] | null;
}

/** Column definition for client-side CSV export fallback. */
export interface CsvExportColumn<T> {
  header: string;
  value: (row: T) => unknown;
}
