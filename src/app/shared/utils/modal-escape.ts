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
  void service.confirmDanger({ title: 'common.unsaved_title', message: 'common.unsaved_message' }).then(ok => { if (ok) clickApproved(close); });
}

const INPUT_BACKDROP = '.erpm-modal-backdrop:not(.app-dialog-backdrop):not(.print-dialog-backdrop), .modal-backdrop, .drawer-backdrop';
const CLOSE_BUTTON = '.modal-close-btn, .close-btn, .erpm-modal-footer .erpm-btn-secondary';
let approved: Element | null = null;

function clickApproved(button: HTMLElement): void {
  approved = button;
  try { button.click(); } finally { approved = null; }
}

/**
 * Input modals (they hold a field) never close from a click on the dimmed backdrop, and X/Cancel ask first once a field
 * was edited. Modals without fields (confirm, print, view-only) close as before. Registered once in capture phase so it
 * runs before each screen's own (click) handler.
 */
export function guardModalDismiss(e: MouseEvent, dialogs: () => DialogService): void {
  const target = e.target as HTMLElement | null;
  const backdrop = target?.closest?.<HTMLElement>(INPUT_BACKDROP);
  if (!target || !backdrop || !backdrop.querySelector('input:not([type=hidden]), select, textarea')) return;
  if (target === backdrop) { e.stopPropagation(); return; }
  const button = target.closest<HTMLElement>(CLOSE_BUTTON);
  if (!button || button === approved || !backdrop.contains(button) || !backdrop.querySelector('.ng-dirty')) return;
  e.stopPropagation();
  e.preventDefault();
  void dialogs().confirmDanger({ title: 'common.unsaved_title', message: 'common.unsaved_message' }).then(ok => { if (ok) clickApproved(button); });
}
