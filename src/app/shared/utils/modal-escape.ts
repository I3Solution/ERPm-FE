import type { DialogService } from '../../core/services/dialog.service';

/**
 * Escape closes the top input modal/drawer. A form edited inside it asks first, so a stray key press cannot lose
 * the data. Confirm/print dialogs and dropdown panels handle Escape themselves and are skipped.
 */
export function handleModalEscape(e: KeyboardEvent, dialogs: () => DialogService): void {
  if (e.key !== 'Escape' || e.defaultPrevented) return;
  if ((e.target as HTMLElement | null)?.closest?.('app-custom-select, app-async-select, app-branch-tree-select, [role="listbox"]')) return;
  const modals = document.querySelectorAll<HTMLElement>(
    '.erpm-modal-backdrop:not(.app-dialog-backdrop):not(.print-dialog-backdrop), .modal-backdrop, .drawer-backdrop');
  const top = modals[modals.length - 1];
  const close = top?.querySelector<HTMLElement>('.modal-close-btn, .close-btn');
  if (!close) return;
  const service = dialogs();
  if (service.current()) return;
  if (!top.querySelector('.ng-dirty')) { close.click(); return; }
  e.preventDefault();
  void service.confirmDanger({ title: 'common.unsaved_title', message: 'common.unsaved_message' }).then(ok => { if (ok) close.click(); });
}
