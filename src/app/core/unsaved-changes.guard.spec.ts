import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { unsavedChangesGuard, HasUnsavedChanges } from './unsaved-changes.guard';
import { DialogService } from './services/dialog.service';

describe('unsavedChangesGuard', () => {
  const run = (c: HasUnsavedChanges) => TestBed.runInInjectionContext(() =>
    unsavedChangesGuard(c, {} as ActivatedRouteSnapshot, {} as RouterStateSnapshot, {} as RouterStateSnapshot));

  it('lets a clean page go without asking', () => {
    const dialog = TestBed.inject(DialogService); const ask = spyOn(dialog, 'confirm');
    expect(run({ hasUnsavedChanges: () => false })).toBeTrue();
    expect(ask).not.toHaveBeenCalled();
  });

  it('asks when dirty and follows the answer', async () => {
    const dialog = TestBed.inject(DialogService);
    spyOn(dialog, 'confirm').and.resolveTo(false);
    expect(await run({ hasUnsavedChanges: () => true })).toBeFalse();
  });
});
