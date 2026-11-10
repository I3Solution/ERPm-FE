import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { SkeletonComponent } from '../skeleton/skeleton.component';

/**
 * Common frame of every list screen: header (title + actions), filter bar, body, and a footer with paging.
 * It draws the loading skeleton, the error box with a retry button, and the empty state; the host only projects
 * the table/cards as the default content and reports how many rows it has loaded in `count`.
 *
 * Slots: [actions] header buttons, [filters] toolbar under the header, default = the rows (table or cards).
 * The host keeps page/filter state in the URL (see createListQueryState) so Back returns to the same place.
 */
@Component({
  selector: 'app-list-page',
  standalone: true,
  imports: [TranslatePipe, SkeletonComponent],
  templateUrl: './list-page.component.html',
  styleUrl: './list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListPageComponent {
  /** Dictionary key or plain text. */
  public readonly title = input.required<string>();
  public readonly subtitle = input('');
  public readonly icon = input('');
  public readonly loading = input(false);
  /** True when the last load failed. */
  public readonly error = input(false);
  /** Number of rows currently loaded; zero shows the empty state. */
  public readonly count = input(0);
  /** Total rows on the server. Paging is hidden when everything fits one page. */
  public readonly total = input(0);
  /** 1-based page. */
  public readonly page = input(1);
  public readonly pageSize = input(20);
  /** Dictionary key of the empty-state text. */
  public readonly emptyText = input('common.no_results');

  public readonly pageChange = output<number>();
  public readonly retry = output<void>();

  public readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize()))));
  public readonly showPaging = computed(() => this.pageCount() > 1);
  public readonly firstShown = computed(() => this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  public readonly lastShown = computed(() => Math.min(this.total(), this.page() * this.pageSize()));
  /** First load: nothing to show yet, so draw the skeleton instead of the body. */
  public readonly showSkeleton = computed(() => this.loading() && this.count() === 0 && !this.error());
  public readonly showEmpty = computed(() => !this.loading() && !this.error() && this.count() === 0);
  public readonly showBody = computed(() => !this.error() && this.count() > 0);

  constructor() {
    // A page beyond the real last page (stale link, rows deleted) is pulled back to the last page.
    effect(() => {
      if (!this.loading() && !this.error() && this.total() > 0 && this.page() > this.pageCount()) this.pageChange.emit(this.pageCount());
    });
  }

  public go(page: number): void {
    const next = Math.min(this.pageCount(), Math.max(1, page));
    if (next !== this.page()) this.pageChange.emit(next);
  }
}
