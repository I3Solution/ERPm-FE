import { ChangeDetectionStrategy, Component, ElementRef, HostListener, effect, inject, signal } from '@angular/core';
import { DialogService, DialogTone } from '../../../core/services/dialog.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * Draws the dialog that DialogService is asking for (confirm, info, success, warning, error and prompt).
 * Mount it once in the app shell; screens never use it directly, they call DialogService.
 */
@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-dialog.component.html',
  styleUrls: ['./app-dialog.component.scss']
})
export class AppDialogComponent {
  public dialogs = inject(DialogService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Text typed into a prompt. */
  public answer = signal('');
  /** True once the user tried to confirm an empty required prompt. */
  public missing = signal(false);

  constructor() {
    // A new dialog starts with its own input and puts the focus on its main control, so Enter and Escape work at once.
    effect(() => {
      const request = this.dialogs.current();
      this.answer.set(request?.initialValue ?? '');
      this.missing.set(false);
      if (request) queueMicrotask(() => this.host.nativeElement.querySelector<HTMLElement>('[data-autofocus]')?.focus());
    });
  }

  public icon(tone: DialogTone): string {
    return { info: 'ℹ️', success: '✅', warning: '⚠️', danger: '⛔' }[tone];
  }

  public onInput(event: Event): void {
    this.answer.set((event.target as HTMLInputElement | HTMLTextAreaElement).value);
    this.missing.set(false);
  }

  public confirm(): void {
    const request = this.dialogs.current();
    if (!request) return;
    if (request.kind === 'prompt') {
      const text = this.answer().trim();
      if (request.required && !text) { this.missing.set(true); return; }
      this.dialogs.close(text);
    } else {
      this.dialogs.close(request.kind === 'confirm' ? true : null);
    }
  }

  /** Cancel button, Escape and a click outside the dialog all count as "no". */
  @HostListener('document:keydown.escape')
  public cancel(): void {
    const request = this.dialogs.current();
    if (!request) return;
    this.dialogs.close(request.kind === 'confirm' ? false : null);
  }
}
