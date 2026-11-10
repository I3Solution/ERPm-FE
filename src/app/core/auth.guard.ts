import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './services/auth.service';
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService); const router = inject(Router);
  const loginTree = router.createUrlTree(['/login'], { queryParams: state.url && state.url !== '/login' ? { returnUrl: state.url } : undefined });
  if (!auth.isAuthenticated()) return loginTree;
  if (auth.account()) return true;
  return auth.loadAccount().pipe(map(() => true), catchError(() => of(loginTree)));
};
