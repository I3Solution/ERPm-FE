import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogService } from '../../../core/services/dialog.service';
import { LocalizationService } from '../../../core/services/localization.service';
import { AppDialogComponent } from './app-dialog.component';

describe('AppDialogComponent', () => {
  let fixture: ComponentFixture<AppDialogComponent>;
  let dialogs: DialogService;

  const el = (selector: string) => fixture.nativeElement.querySelector(selector) as HTMLElement | null;
  const click = (selector: string) => { el(selector)!.click(); fixture.detectChanges(); };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppDialogComponent],
      providers: [{ provide: LocalizationService, useValue: { translate: (key: string) => ({ 'dialog.ok': 'OK', 'dialog.confirm': 'Confirm', 'common.cancel': 'Cancel', 'dialog.title.warning': 'Warning', 'dialog.required': 'Required' } as Record<string, string>)[key] ?? key } }]
    });
    fixture = TestBed.createComponent(AppDialogComponent);
    dialogs = TestBed.inject(DialogService);
    fixture.detectChanges();
  });
  afterEach(() => TestBed.resetTestingModule());

  it('draws nothing while no dialog is asked for', () => {
    expect(el('[data-testid="app-dialog"]')).toBeNull();
  });

  it('answers a question with true on confirm and false on cancel', async () => {
    const yes = dialogs.confirm({ message: 'Delete this?' });
    fixture.detectChanges();
    expect(el('.app-dialog-message')!.textContent).toContain('Delete this?');
    expect(el('.app-dialog-title')!.textContent).toContain('Warning');
    click('[data-testid="app-dialog-ok"]');
    expect(await yes).toBeTrue();
    expect(el('[data-testid="app-dialog"]')).toBeNull();

    const no = dialogs.confirm({ message: 'Again?' });
    fixture.detectChanges();
    click('[data-testid="app-dialog-cancel"]');
    expect(await no).toBeFalse();
  });

  it('counts Escape and a click outside as "no"', async () => {
    const byEscape = dialogs.confirm({ message: 'Q1' });
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(await byEscape).toBeFalse();

    const byBackdrop = dialogs.confirm({ message: 'Q2' });
    fixture.detectChanges();
    click('[data-testid="app-dialog"]');
    expect(await byBackdrop).toBeFalse();
  });

  it('shows a message dialog with a single button and styles errors as danger', async () => {
    const done = dialogs.error('Something broke');
    fixture.detectChanges();
    expect(el('[data-testid="app-dialog-cancel"]')).toBeNull();
    expect(el('.app-dialog')!.classList).toContain('app-dialog-danger');
    expect(el('[data-testid="app-dialog-ok"]')!.classList).toContain('erpm-btn-danger');
    click('[data-testid="app-dialog-ok"]');
    await done;
    expect(el('[data-testid="app-dialog"]')).toBeNull();
  });

  it('asks for a required reason, refuses an empty one and returns the trimmed text', async () => {
    const reason = dialogs.prompt({ message: 'Why?', label: 'Reason', required: true });
    fixture.detectChanges();
    click('[data-testid="app-dialog-ok"]');
    expect(el('.app-dialog-error')!.textContent).toContain('Required');

    const input = el('#app-dialog-input') as HTMLTextAreaElement;
    input.value = '  customer changed mind  ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(el('.app-dialog-error')).toBeNull();
    click('[data-testid="app-dialog-ok"]');
    expect(await reason).toBe('customer changed mind');
  });

  it('gives null when a prompt is cancelled', async () => {
    const reason = dialogs.prompt({ message: 'Why?' });
    fixture.detectChanges();
    click('[data-testid="app-dialog-cancel"]');
    expect(await reason).toBeNull();
  });

  it('shows dialogs one after another when several are asked at once', async () => {
    const first = dialogs.confirm({ message: 'First' });
    const second = dialogs.info('Second');
    fixture.detectChanges();
    expect(el('.app-dialog-message')!.textContent).toContain('First');
    click('[data-testid="app-dialog-ok"]');
    expect(await first).toBeTrue();
    expect(el('.app-dialog-message')!.textContent).toContain('Second');
    click('[data-testid="app-dialog-ok"]');
    await second;
    expect(el('[data-testid="app-dialog"]')).toBeNull();
  });
});
