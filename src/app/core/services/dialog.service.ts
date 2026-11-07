import { Injectable, inject, signal } from '@angular/core';
import { LocalizationService } from './localization.service';

/** Look of a dialog: the icon and the colour of its main button. */
export type DialogTone = 'info' | 'success' | 'warning' | 'danger';

export interface DialogOptions {
  /** Heading. Defaults to the standard heading of the dialog kind. A dictionary key or plain text. */
  title?: string;
  /** Main text. A dictionary key or plain text. */
  message: string;
  /** Label of the main button. Defaults to OK (message dialogs) or Confirm (questions). */
  confirmText?: string;
  /** Label of the cancelling button of questions. */
  cancelText?: string;
  tone?: DialogTone;
}

export interface PromptOptions extends DialogOptions {
  /** Label above the input. */
  label?: string;
  placeholder?: string;
  /** When true the answer cannot be empty. */
  required?: boolean;
  maxLength?: number;
  initialValue?: string;
}

export type DialogKind = 'confirm' | 'message' | 'prompt';

/** One dialog waiting to be shown or being shown; the texts are already translated. */
export interface DialogRequest {
  kind: DialogKind;
  tone: DialogTone;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  label: string;
  placeholder: string;
  required: boolean;
  maxLength: number;
  initialValue: string;
  /** Closes the dialog; the value is what the caller gets back (true/false for questions, the text or null for prompts). */
  resolve: (value: boolean | string | null) => void;
}

/**
 * The one place that asks the user for a decision or tells them something, instead of window.confirm and alert.
 * Calls return a promise that settles when the user answers; if several are made at once they are shown one after
 * another. The dialogs themselves are drawn by AppDialogComponent, mounted once in the app shell.
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private i18n = inject(LocalizationService);
  private queue: DialogRequest[] = [];

  /** The dialog on screen, or null. */
  public readonly current = signal<DialogRequest | null>(null);

  /** Asks a yes/no question. Resolves true when confirmed, false when cancelled, dismissed or closed with Escape. */
  public confirm(options: DialogOptions): Promise<boolean> {
    return this.open('confirm', { tone: 'warning', ...options }) as Promise<boolean>;
  }

  /** Same as confirm but styled as a destructive action (red main button). */
  public confirmDanger(options: DialogOptions): Promise<boolean> {
    return this.confirm({ ...options, tone: 'danger' });
  }

  /** Asks for a short text such as a reason. Resolves the trimmed text, or null when cancelled. */
  public prompt(options: PromptOptions): Promise<string | null> {
    return this.open('prompt', { tone: 'info', ...options }) as Promise<string | null>;
  }

  public info(message: string, options: Partial<DialogOptions> = {}): Promise<void> { return this.message('info', message, options); }
  public success(message: string, options: Partial<DialogOptions> = {}): Promise<void> { return this.message('success', message, options); }
  public warning(message: string, options: Partial<DialogOptions> = {}): Promise<void> { return this.message('warning', message, options); }
  public error(message: string, options: Partial<DialogOptions> = {}): Promise<void> { return this.message('danger', message, options); }

  /** Called by the dialog component when the user answers; shows the next waiting dialog if any. */
  public close(value: boolean | string | null): void {
    const open = this.current();
    if (!open) return;
    open.resolve(value);
    this.current.set(this.queue.shift() ?? null);
  }

  private async message(tone: DialogTone, message: string, options: Partial<DialogOptions>): Promise<void> {
    await this.open('message', { ...options, tone, message });
  }

  private open(kind: DialogKind, options: PromptOptions): Promise<boolean | string | null> {
    return new Promise(resolve => {
      const tone = options.tone ?? 'info';
      const request: DialogRequest = {
        kind, tone,
        title: this.t(options.title ?? `dialog.title.${tone}`),
        message: this.t(options.message),
        confirmText: this.t(options.confirmText ?? (kind === 'message' ? 'dialog.ok' : 'dialog.confirm')),
        cancelText: this.t(options.cancelText ?? 'common.cancel'),
        label: options.label ? this.t(options.label) : '',
        placeholder: options.placeholder ? this.t(options.placeholder) : '',
        required: options.required ?? false,
        maxLength: options.maxLength ?? 500,
        initialValue: options.initialValue ?? '',
        resolve
      };
      if (this.current()) this.queue.push(request); else this.current.set(request);
    });
  }

  // Texts may be dictionary keys or plain text; a missing key falls back to the key itself, which reads as plain text.
  private t(textOrKey: string): string { return this.i18n.translate(textOrKey); }
}
