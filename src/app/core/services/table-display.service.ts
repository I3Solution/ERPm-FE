import { Injectable, signal } from '@angular/core';

/** How a table cell shows content that is too long for its column. */
export type CellOverflowMode = 'truncate' | 'wrap';

/**
 * Global (all screens) preference for long table cells.
 * - truncate: clamp to a few lines, end with "...", hover shows the full text (default).
 * - wrap: show everything, the row grows.
 * Applied as `data-cell-overflow` on <html>; the CSS lives in theme/tables.scss.
 */
@Injectable({ providedIn: 'root' })
export class TableDisplayService {
  private readonly storageKey = 'erpm_cell_overflow';

  public readonly cellOverflow = signal<CellOverflowMode>('truncate');

  constructor() {
    let saved: string | null = null;
    try { saved = localStorage.getItem(this.storageKey); } catch { /* storage may be blocked */ }
    this.set(saved === 'wrap' ? 'wrap' : 'truncate');
  }

  public toggle(): void {
    this.set(this.cellOverflow() === 'truncate' ? 'wrap' : 'truncate');
  }

  private set(mode: CellOverflowMode): void {
    this.cellOverflow.set(mode);
    document.documentElement.setAttribute('data-cell-overflow', mode);
    try { localStorage.setItem(this.storageKey, mode); } catch { /* storage may be blocked */ }
  }
}
