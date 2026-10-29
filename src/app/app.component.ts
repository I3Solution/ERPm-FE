import { AuthService } from './core/services/auth.service';
import { ApiErrorService } from './core/services/api-error.service';
import { BranchService } from './core/services/branch.service';
import { ChangeDetectionStrategy, Component, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from './shared/pipes/translate.pipe';
import { LocalizationService } from './core/services/localization.service';
import { ThemeService } from './core/services/theme.service';
import { BranchTreeSelectComponent } from './shared/components/branch-tree-select/branch-tree-select.component';

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
    BranchTreeSelectComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(
    private localizationService: LocalizationService,
    public auth: AuthService, public apiErrors: ApiErrorService, private branches: BranchService,
    private themeService: ThemeService
  ) {
    effect(() => { const signedIn = this.auth.isAuthenticated(); untracked(() => { if (signedIn) this.branches.loadBranches(); else { this.branches.branches.set([]); this.branches.branchTree.set([]); this.branches.currentBranch.set(null); } }); });
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
