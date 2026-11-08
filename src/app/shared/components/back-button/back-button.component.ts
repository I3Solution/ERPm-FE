import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * Standard "back to list" button. Navigates to `link` (keeping `queryParams` so the list returns to the same
 * page/filter) and also emits `back` so a host can run its own logic first.
 */
@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './back-button.component.html',
  styleUrl: './back-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackButtonComponent {
  private router = inject(Router);

  /** Router commands of the list route, e.g. ['/catalog']. Empty = only emit `back`. */
  public readonly link = input<string | unknown[]>('');
  public readonly queryParams = input<Record<string, unknown> | null>(null);
  /** Dictionary key of the label. */
  public readonly label = input('common.back_to_list');
  public readonly back = output<void>();

  public onClick(): void {
    this.back.emit();
    const link = this.link();
    const commands = Array.isArray(link) ? link : (link ? [link] : []);
    if (commands.length) void this.router.navigate(commands, { queryParams: this.queryParams() ?? undefined });
  }
}
