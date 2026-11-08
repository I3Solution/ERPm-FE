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
    AppDialogComponent
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
