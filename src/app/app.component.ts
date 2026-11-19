import { AuthService } from './core/services/auth.service';
import { ApiErrorService } from './core/services/api-error.service';
import { BranchService } from './modules/SYS/services/branch.service';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, Injector, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TranslatePipe } from './shared/pipes/translate.pipe';
import { LocalizationService } from './core/services/localization.service';
import { guardModalDismiss, handleModalEscape } from './shared/utils/modal-escape';
import { DialogService } from './core/services/dialog.service';
import { ThemeService } from './core/services/theme.service';
import { TableDisplayService } from './core/services/table-display.service';
import { NavigationHistoryService } from './core/services/navigation-history.service';
import { BranchTreeSelectComponent } from './shared/components/branch-tree-select/branch-tree-select.component';
import { NotificationBellComponent } from './shared/components/notification-bell/notification-bell.component';
import { NotificationToastComponent } from './shared/components/notification-toast/notification-toast.component';
import { AppDialogComponent } from './shared/components/app-dialog/app-dialog.component';
import { DropdownMenuComponent, MenuItem } from './shared/components/dropdown-menu/dropdown-menu.component';
import { ModuleNavigationComponent } from './shared/components/module-navigation/module-navigation.component';

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
    DropdownMenuComponent,
    ModuleNavigationComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // Input modals: backdrop click is ignored and X/Cancel ask once edited (see guardModalDismiss).
  private readonly guardModals = (() => {
    const onClick = (e: MouseEvent) => guardModalDismiss(e, () => this.injector.get(DialogService));
    document.addEventListener('click', onClick, true);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('click', onClick, true));
  })();

  private readonly injector = inject(Injector);
  private readonly escapeCloseModal = document.addEventListener('keydown', e => handleModalEscape(e, () => this.injector.get(DialogService)));

  constructor(
    private localizationService: LocalizationService,
    public auth: AuthService, public apiErrors: ApiErrorService, private branches: BranchService,
    private themeService: ThemeService,
    private tableDisplay: TableDisplayService,
    private router: Router,
    private navHistory: NavigationHistoryService
  ) {
    effect(() => { const signedIn = this.auth.isAuthenticated(); untracked(() => { if (signedIn) this.branches.loadBranches(); else { this.branches.branches.set([]); this.branches.branchTree.set([]); this.branches.currentBranch.set(null); } }); });
  }

  public profileItems = computed<MenuItem[]>(() => [
    { id: 'lang-vi', label: 'header.lang_vi', current: this.currentLang() === 'vi' },
    { id: 'lang-en', label: 'header.lang_en', current: this.currentLang() === 'en' },
    { id: 'theme', label: this.isDarkMode() ? 'theme.light' : 'theme.dark', icon: this.isDarkMode() ? '☀' : '☾' },
    { id: 'cells', label: this.cellOverflow() === 'truncate' ? 'table.action_wrap_cells' : 'table.action_truncate_cells',
      icon: this.cellOverflow() === 'truncate' ? '↵' : '…' },
    { id: 'sign-out', label: 'auth.sign_out', icon: '⎋', danger: true }
  ]);

  public onProfileAction(id: string): void {
    if (id === 'sign-out') { this.auth.logout(); this.router.navigateByUrl('/login'); }
    else if (id === 'theme') this.toggleTheme();
    else if (id === 'cells') this.tableDisplay.toggle();
    else if (id === 'lang-vi' || id === 'lang-en') this.setLanguage(id === 'lang-vi' ? 'vi' : 'en');
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

  public isMoreRouteActive(): boolean {
    const path = (this.router.url ?? '').split(/[?#]/, 1)[0];
    return this.isAdminRouteActive() || path.startsWith('/accounting/') || path.startsWith('/sales/') || path.startsWith('/notifications');
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

  /** Global long-cell mode (truncate with hover, or wrap); see TableDisplayService. */
  public get cellOverflow() { return this.tableDisplay.cellOverflow; }

  public toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
