import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { DialogService } from './services/dialog.service';

/** Implemented by a detail page component that can hold edits not yet saved. */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/**
 * Route guard for detail pages: when the component reports unsaved edits, asks the user (DialogService, never
 * window.confirm) before leaving. Resolves true to leave, false to stay.
 * Usage: { path: ':id', component: X, canDeactivate: [unsavedChangesGuard] }
 */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component?.hasUnsavedChanges?.()) return true;
  return inject(DialogService).confirm({
    title: 'common.unsaved_title',
    message: 'common.unsaved_message',
    confirmText: 'common.leave',
    cancelText: 'common.stay',
    tone: 'warning'
  });
};
