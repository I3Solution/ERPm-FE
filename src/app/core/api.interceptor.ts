import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './services/auth.service';
import { ApiErrorService } from './services/api-error.service';

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith('/api/')) return next(request);
  const auth = inject(AuthService);
  const errors = inject(ApiErrorService);
  const router = inject(Router);
  const token = auth.token();
  if (token && !request.url.endsWith('/auth/login')) request = request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  return next(request).pipe(catchError((error: HttpErrorResponse) => {
    if (token && token !== auth.token()) return throwError(() => error);
    const code = error.error?.errorCode || error.error?.message;
    errors.message.set(typeof code === 'string' && code.startsWith('error.') ? code : error.status === 403 ? 'error.access.denied' : error.status === 401 ? 'error.auth.invalid' : error.status === 429 ? 'error.auth.rate_limit' : 'error.connection');
    if (error.status === 401 && token && token === auth.token() && !request.url.endsWith('/auth/login')) { auth.logout(); void router.navigateByUrl('/login'); }
    return throwError(() => error);
  }));
};
