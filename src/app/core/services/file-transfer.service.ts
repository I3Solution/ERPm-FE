import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CsvExportColumn, ImportResult, TransferApiResponse } from '../models/file-transfer.models';

/**
 * Core file download/export and upload/import service shared across all ERPm FE modules.
 */
@Injectable({ providedIn: 'root' })
export class FileTransferService {
  private readonly http = inject(HttpClient);

  /** Downloads a binary file from the API, extracts the server filename, and triggers browser save. */
  public exportFile(
    url: string,
    params?: Record<string, string | number | boolean | null | undefined>,
    fallbackFileName = 'export.xlsx'
  ): Observable<string> {
    let httpParams = new HttpParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      }
    }

    return this.http.get(url, {
      params: httpParams,
      observe: 'response',
      responseType: 'blob'
    }).pipe(
      map((res: HttpResponse<Blob>) => {
        const fileName = this.extractFileName(res.headers.get('Content-Disposition'), fallbackFileName);
        if (res.body) {
          this.triggerDownload(res.body, fileName);
        }
        return fileName;
      })
    );
  }

  /** Uploads a spreadsheet file as multipart/form-data and returns the parsed ImportResult envelope. */
  public importFile<T>(
    url: string,
    file: File,
    extraFields?: Record<string, string | number | boolean>
  ): Observable<TransferApiResponse<ImportResult<T>>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    if (extraFields) {
      for (const [key, value] of Object.entries(extraFields)) {
        formData.append(key, String(value));
      }
    }
    return this.http.post<TransferApiResponse<ImportResult<T>>>(url, formData);
  }

  /** Lightweight client-side UTF-8 BOM CSV export when no backend export endpoint is required. */
  public exportCsv<T>(fileName: string, columns: CsvExportColumn<T>[], rows: T[]): void {
    const escapeCell = (raw: unknown): string => {
      if (raw === null || raw === undefined) return '';
      const str = String(raw);
      return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const headerLine = columns.map(c => escapeCell(c.header)).join(',');
    const dataLines = rows.map(row => columns.map(c => escapeCell(c.value(row))).join(','));
    const csv = `\uFEFF${[headerLine, ...dataLines].join('\r\n')}`;
    const safeName = fileName.toLowerCase().endsWith('.csv') ? fileName : `${fileName}.csv`;

    this.triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), safeName);
  }

  /** Parses RFC 5987 (filename*=UTF-8'') and standard quoted/unquoted Content-Disposition filenames. */
  public extractFileName(disposition: string | null, fallback: string): string {
    if (!disposition) return fallback;
    const utf8Match = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(disposition);
    if (utf8Match?.[1]) {
      try {
        return decodeURIComponent(utf8Match[1].trim());
      } catch {
        return utf8Match[1].trim();
      }
    }
    const plainMatch = /filename\s*=\s*"?([^";]+)"?/i.exec(disposition);
    return plainMatch?.[1]?.trim() || fallback;
  }

  private triggerDownload(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}
