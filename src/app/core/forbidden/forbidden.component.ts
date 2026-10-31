import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

/** Shown when a signed-in account opens a route its roles do not grant. */
@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="forbidden" role="alert">
      <h1>403</h1>
      <p>{{ 'error.access.denied' | translate }}</p>
      <a routerLink="/dashboard" class="erpm-btn erpm-btn-secondary">{{ 'menu.dashboard' | translate }}</a>
    </section>
  `,
  styles: [`.forbidden { display: grid; gap: 12px; justify-items: center; padding: 64px 16px; text-align: center; }`]
})
export class ForbiddenComponent {}
