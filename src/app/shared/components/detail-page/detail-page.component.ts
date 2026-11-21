import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { BackButtonComponent } from '../back-button/back-button.component';
import { ActionBarComponent, type PageAction } from '../action-bar/action-bar.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

/**
 * Common frame of every detail screen (routes `<screen>/new` and `<screen>/:id`): a compact top bar, pinned to the top
 * of the scrolling page area, with the standard back button and an action area (shows the title once it scrolls away), a title block, and the body. Draws the loading skeleton and the error box.
 * Pair it with unsavedChangesGuard on the route so leaving a dirty form asks first.
 *
 * Slots: [actions] right side of the top bar (save, delete...), [meta] under the title (status chip...), default = body.
 */
@Component({
  selector: 'app-detail-page',
  standalone: true,
  imports: [TranslatePipe, BackButtonComponent, SkeletonComponent, ActionBarComponent],
  templateUrl: './detail-page.component.html',
  styleUrl: './detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailPageComponent {
  /** Dictionary key or plain text; usually the record name/code once loaded. */
  public readonly title = input('');
  public readonly subtitle = input('');
  public readonly loading = input(false);
  public readonly error = input(false);
  /**
   * List route used when there is no in-app history (direct link, F5). Otherwise the back button pops the browser
   * history, which returns to the list with its page/search query params intact.
   */
  public readonly backLink = input('/');
  public readonly backLabel = input('common.back');

  /** Standard action bar, same declaration as list pages. */
  public readonly actions = input<PageAction[]>([]);
  public readonly actionSelect = output<string>();
  public readonly retry = output<void>();

  private readonly sentinel = viewChild.required<ElementRef<HTMLElement>>('sentinel');
  private readonly header = viewChild<ElementRef<HTMLElement>>('header');
  /** True while the bar is pinned (its in-flow marker has scrolled out of view). */
  protected readonly stuck = signal(false);
  /** True while the big page title is out of view, so the bar repeats it. */
  protected readonly titleOut = signal(false);

  constructor() {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      for (const e of entries) (e.target === this.sentinel().nativeElement ? this.stuck : this.titleOut).set(!e.isIntersecting);
    });
    effect(() => {
      const sentinel = this.sentinel().nativeElement;
      const header = this.header()?.nativeElement;
      observer.disconnect();
      observer.observe(sentinel);
      if (header) observer.observe(header); else this.titleOut.set(false);
    });
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
}
