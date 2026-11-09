import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { BackButtonComponent } from '../back-button/back-button.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

/**
 * Common frame of every detail screen (routes `<screen>/new` and `<screen>/:id`): top bar with the standard back
 * button and an action area, a title block, and the body. Draws the loading skeleton and the error box.
 * Pair it with unsavedChangesGuard on the route so leaving a dirty form asks first.
 *
 * Slots: [actions] right side of the top bar (save, delete...), [meta] under the title (status chip...), default = body.
 */
@Component({
  selector: 'app-detail-page',
  standalone: true,
  imports: [TranslatePipe, BackButtonComponent, SkeletonComponent],
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
  public readonly backLabel = input('common.back_to_list');

  public readonly retry = output<void>();
}
