import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { ImportResult, ImportRowError } from '../../../core/models/file-transfer.models';
import { FileTransferService } from '../../../core/services/file-transfer.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * Reusable Excel/CSV import modal shared across all ERPm modules.
 * Supports downloading a template, uploading a file via FileTransferService, and displaying row-level errors.
 */
@Component({
  selector: 'app-import-dialog',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './import-dialog.component.html',
  styleUrl: './import-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportDialogComponent {
  private readonly transfer = inject(FileTransferService);

  public readonly titleKey = input<string>('transfer.import_title');
  public readonly importUrl = input.required<string>();
  public readonly templateUrl = input<string | null>(null);
  public readonly templateFileName = input<string>('import-template.xlsx');
  public readonly accept = input<string>('.xlsx,.xls');
  public readonly extraFields = input<Record<string, string | number | boolean> | undefined>(undefined);

  public readonly imported = output<ImportResult<unknown>>();
  public readonly closed = output<void>();

  public readonly selectedFile = signal<File | null>(null);
  public readonly uploading = signal(false);
  public readonly downloadingTemplate = signal(false);
  public readonly errors = signal<ImportRowError[]>([]);
  public readonly summary = signal<{ totalRows: number; validCount: number; errorCount: number } | null>(null);
  public readonly clientError = signal<string | null>(null);

  public onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    this.errors.set([]);
    this.summary.set(null);
    this.clientError.set(null);
  }

  public downloadTemplate(): void {
    const url = this.templateUrl();
    if (!url || this.downloadingTemplate()) return;

    this.downloadingTemplate.set(true);
    this.transfer.exportFile(url, undefined, this.templateFileName())
      .pipe(finalize(() => this.downloadingTemplate.set(false)))
      .subscribe();
  }

  public submit(): void {
    const file = this.selectedFile();
    if (!file || this.uploading()) return;

    if (!this.isAllowedExtension(file.name)) {
      this.clientError.set('transfer.invalid_file_type');
      return;
    }

    this.uploading.set(true);
    this.clientError.set(null);
    this.errors.set([]);

    this.transfer.importFile<unknown>(this.importUrl(), file, this.extraFields())
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe({
        next: (res) => {
          const data = res.data;
          if (!data) {
            this.clientError.set(res.errorCode || res.message || 'transfer.import_failed');
            return;
          }
          this.summary.set({
            totalRows: data.totalRows,
            validCount: data.validCount,
            errorCount: data.errorCount
          });
          this.errors.set(data.errors ?? []);
          if (data.isSuccess) {
            this.imported.emit(data);
          }
        },
        error: () => {
          this.clientError.set('transfer.import_failed');
        }
      });
  }

  public close(): void {
    this.closed.emit();
  }

  private isAllowedExtension(fileName: string): boolean {
    const allowed = this.accept()
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
    if (allowed.length === 0) return true;
    const lower = fileName.toLowerCase();
    return allowed.some(ext => lower.endsWith(ext));
  }
}
