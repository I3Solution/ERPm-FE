import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  public message = signal<string | null>(null);
  private started = 0;
  private failedAt = 0;

  /** Registers the start of an API request and returns its order number. */
  begin(): number { return ++this.started; }

  /** Shows an error and remembers how many requests had started by then. */
  fail(code: string): void { this.message.set(code); this.failedAt = this.started; }

  /** A success clears the banner only when its request began after the latest failure (parallel requests must not hide a real error). */
  succeeded(order: number): void { if (order > this.failedAt) this.message.set(null); }
}
