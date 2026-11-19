import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './services/auth.service';

/**
 * Route guard for IAM permissions. Signed-out users go to /login; signed-in users missing every listed action go
 * to /forbidden. Pass several actions to allow access when any one of them is granted.
 * The account is loaded on demand (page refresh) so the decision never runs against an empty permission list.
 */
export const permissionGuard = (...actions: string[]): CanActivateFn => (_route, state) => {
  const auth = inject(AuthService); const router = inject(Router);
  const loginTree = router.createUrlTree(['/login'], { queryParams: state.url && state.url !== '/login' ? { returnUrl: state.url } : undefined });
  if (!auth.isAuthenticated()) return loginTree;
  const decide = () => auth.canAny(actions) ? true : router.createUrlTree(['/forbidden']);
  if (auth.account()) return decide();
  return auth.loadAccount().pipe(map(decide), catchError(() => of(loginTree)));
};
