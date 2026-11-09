import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { filter } from 'rxjs/operators';

/**
 * Service managing in-app route history to enable intelligent back-button navigation.
 * Prevents unexpected exits from the SPA when window.history contains external pages,
 * and ensures returning to previous calling screens (e.g., SO -> Partner Detail -> Back to SO).
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationHistoryService {
  private router = inject(Router);
  private location = inject(Location);
  private history: string[] = [];

  constructor() {
    this.init();
  }

  /**
   * Initializes route tracking on Angular Router NavigationEnd events.
   */
  private init(): void {
    const currentUrl = this.router.url;
    if (currentUrl && currentUrl !== '/') {
      this.history.push(currentUrl);
    }

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        const url = event.urlAfterRedirects || event.url;
        // Avoid duplicate consecutive entries in the history stack
        if (this.history[this.history.length - 1] !== url) {
          this.history.push(url);
        }
      });
  }

  /**
   * Checks whether there is a previous route within the application.
   */
  public hasPrevious(): boolean {
    return this.history.length > 1;
  }

  /**
   * Gets the immediate previous URL in the application history if available.
   */
  public getPreviousUrl(): string | null {
    return this.hasPrevious() ? this.history[this.history.length - 2] : null;
  }

  /**
   * Navigates back to the previous screen.
   * If there is an in-app history entry, uses Location.back() to pop the browser state.
   * Otherwise, falls back to the provided defaultUrl (or root).
   *
   * @param defaultUrl Fallback URL when no in-app history exists (e.g. direct URL entry or F5 refresh)
   */
  public back(defaultUrl: string = '/'): void {
    if (this.hasPrevious()) {
      // Pop the current URL before invoking browser back
      this.history.pop();
      this.location.back();
    } else if (defaultUrl) {
      this.router.navigateByUrl(defaultUrl);
    }
  }

  /**
   * Clears the current history stack.
   */
  public clear(): void {
    this.history = [];
  }
}

