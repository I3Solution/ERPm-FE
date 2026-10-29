import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './services/auth.service';
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService); const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
  if (auth.account()) return true;
  return auth.loadAccount().pipe(map(() => true), catchError(() => of(router.createUrlTree(['/login']))));
};
