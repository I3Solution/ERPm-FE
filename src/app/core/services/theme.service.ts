import { Injectable, signal, computed } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'erpm_theme';
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  /** Current configured theme preference ('light', 'dark', or 'system') */
  public themeMode = signal<ThemeMode>('system');

  /** Actual resolved dark mode state (boolean) */
  public isDarkMode = signal<boolean>(false);

  constructor() {
    this.initializeTheme();
  }

  /**
   * Initialize theme from localStorage or system preference
   */
  private initializeTheme(): void {
    const saved = localStorage.getItem(this.storageKey) as ThemeMode | null;
    const initialMode: ThemeMode = (saved === 'light' || saved === 'dark' || saved === 'system') ? saved : 'system';

    this.themeMode.set(initialMode);
    this.applyTheme(initialMode);

    // Listen for OS system theme changes
    this.mediaQuery.addEventListener('change', (e) => {
      if (this.themeMode() === 'system') {
        this.updateDom(e.matches);
      }
    });
  }

  /**
   * Toggle between light and dark themes
   */
  public toggleTheme(): void {
    const nextMode: ThemeMode = this.isDarkMode() ? 'light' : 'dark';
    this.setTheme(nextMode);
  }

  /**
   * Set specific theme mode
   */
  public setTheme(mode: ThemeMode): void {
    this.themeMode.set(mode);
    localStorage.setItem(this.storageKey, mode);
    this.applyTheme(mode);
  }

  /**
   * Apply theme and update DOM attributes & classes
   */
  private applyTheme(mode: ThemeMode): void {
    const isDark = mode === 'dark' || (mode === 'system' && this.mediaQuery.matches);
    this.updateDom(isDark);
  }

  /**
   * Synchronize DOM classes and attributes for ERPm and Ionic
   */
  private updateDom(isDark: boolean): void {
    this.isDarkMode.set(isDark);
    const themeName = isDark ? 'dark' : 'light';

    // HTML root attribute
    document.documentElement.setAttribute('data-theme', themeName);

    // Body classes for ERPm and Ionic Palette
    if (isDark) {
      document.body.classList.add('dark-theme', 'ion-palette-dark');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme', 'ion-palette-dark');
    }

    // Update meta theme-color for mobile browser status bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#111827' : '#4f46e5');
    }
  }
}
