import { AuthService } from './core/services/auth.service';
import { ApiErrorService } from './core/services/api-error.service';
import { BranchService } from './modules/SYS/services/branch.service';
import { ChangeDetectionStrategy, Component, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TranslatePipe } from './shared/pipes/translate.pipe';
import { LocalizationService } from './core/services/localization.service';
import { ThemeService } from './core/services/theme.service';
import { NavigationHistoryService } from './core/services/navigation-history.service';
import { BranchTreeSelectComponent } from './shared/components/branch-tree-select/branch-tree-select.component';
import { NotificationBellComponent } from './shared/components/notification-bell/notification-bell.component';
import { NotificationToastComponent } from './shared/components/notification-toast/notification-toast.component';
import { AppDialogComponent } from './shared/components/app-dialog/app-dialog.component';
import { DropdownMenuComponent, MenuItem } from './shared/components/dropdown-menu/dropdown-menu.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    BranchTreeSelectComponent,
    NotificationBellComponent,
    NotificationToastComponent,
    AppDialogComponent,
    DropdownMenuComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(
    private localizationService: LocalizationService,
    public auth: AuthService, public apiErrors: ApiErrorService, private branches: BranchService,
    private themeService: ThemeService,
    private router: Router,
    private navHistory: NavigationHistoryService
  ) {
    effect(() => { const signedIn = this.auth.isAuthenticated(); untracked(() => { if (signedIn) this.branches.loadBranches(); else { this.branches.branches.set([]); this.branches.branchTree.set([]); this.branches.currentBranch.set(null); } }); });
  }

  /** Actions of the account menu; add an item here (and a case in onProfileAction) for profile, password and so on. */
  public readonly profileItems: MenuItem[] = [{ id: 'sign-out', label: 'auth.sign_out', icon: '⎋', danger: true }];

  public onProfileAction(id: string): void {
    if (id === 'sign-out') { this.auth.logout(); this.router.navigateByUrl('/login'); }
  }

  /** Up to two letters from the account's display name, for the avatar. */
  public initials(): string {
    const words = (this.auth.account()?.displayName ?? '').trim().split(/\s+/).filter(Boolean);
    return ((words[0]?.[0] ?? '') + (words.length > 1 ? words[words.length - 1][0] : words[0]?.[1] ?? '')).toUpperCase() || '?';
  }

  /**
   * Returns true when the active route belongs to an administration module.
   */
  public isAdminRouteActive(): boolean {
    const url = this.router?.url ?? '';
    return url.startsWith('/admin') ||
      url.startsWith('/org') ||
      url.startsWith('/department-levels') ||
      url.startsWith('/job-positions') ||
      url.startsWith('/employees') ||
      url.startsWith('/users') ||
      url.startsWith('/roles');
  }

  public get currentLang() {
    return this.localizationService.currentLang;
  }

  public get isDarkMode() {
    return this.themeService.isDarkMode;
  }

  public setLanguage(lang: 'vi' | 'en'): void {
    this.localizationService.setLanguage(lang);
  }

  public toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
