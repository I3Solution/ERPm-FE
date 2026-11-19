import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { DropdownMenuComponent, type MenuItem } from '../dropdown-menu/dropdown-menu.component';

export interface PageAction extends MenuItem {
  /** Permission code; the action is hidden when the user lacks it. */
  permission?: string;
  /** The main action is always visible. Secondary actions share the overflow menu. */
  primary?: boolean;
  /** Keep the action disabled until at least one row is selected. */
  requiresSelection?: boolean;
}

/**
 * Page toolbar with slots for navigation ([toolbar-start]), filters ([filters]), and custom buttons ([actions]).
 * The host reacts to `actionSelect` with the chosen id for actions declared in `actions`.
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
  public readonly actions = input<PageAction[]>([]);
  public readonly selectedCount = input(0);
  public readonly actionSelect = output<string>();
  public readonly clearSelection = output<void>();

  private readonly auth = inject(AuthService);
  private readonly allowed = computed(() => this.actions()
    .filter(action => !action.permission || this.auth.can(action.permission))
    .map(action => action.requiresSelection && this.selectedCount() === 0 ? { ...action, disabled: true } : action));
  public readonly primaryAction = computed(() => this.allowed().find(a => a.primary));
  public readonly menuActions = computed(() => this.allowed().filter(action => action !== this.primaryAction()));
}
