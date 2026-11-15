import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { DropdownMenuComponent } from '../dropdown-menu/dropdown-menu.component';
import type { ListAction } from '../list-page/list-page.component';

/**
 * Standard action bar shared by list and detail pages: the primary action is a button, the rest share one "⋯" menu.
 * Actions are declared as data (see ListAction); the host reacts to `actionSelect` with the chosen id.
 */
@Component({
  selector: 'app-action-bar',
  standalone: true,
  imports: [TranslatePipe, DropdownMenuComponent],
  templateUrl: './action-bar.component.html',
  styleUrl: './action-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionBarComponent {
  public readonly actions = input<ListAction[]>([]);
  public readonly actionSelect = output<string>();

  private readonly auth = inject(AuthService);
  private readonly allowed = computed(() => this.actions().filter(a => !a.permission || this.auth.can(a.permission)));
  public readonly primaryAction = computed(() => this.allowed().find(a => a.primary));
  public readonly menuActions = computed(() => this.allowed().filter(a => !a.primary));
}
