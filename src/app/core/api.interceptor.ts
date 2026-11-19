import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';
import { AuthService } from './services/auth.service';
import { ApiErrorService } from './services/api-error.service';
import { LocalizationService } from './services/localization.service';

/** Codes whose server message carries values the dictionary text cannot (for example the overlapping version). */
const SERVER_TEXT_CODES = new Set(['error.sd.pricelist_version_overlap']);

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith('/api/')) return next(request);
  const auth = inject(AuthService);
  const errors = inject(ApiErrorService);
  const router = inject(Router);
  const lang = inject(LocalizationService).currentLang();
  const order = errors.begin();
  const token = auth.token();
  if (token && !request.url.endsWith('/auth/login')) request = request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  // The server fills parameters into its localized message, so it needs the UI language.
  request = request.clone({ setHeaders: { 'Accept-Language': lang } });
  return next(request).pipe(
    // A successful response of a request that began after the latest failure retires that failure's banner.
    tap(event => { if (event instanceof HttpResponse) errors.succeeded(order); }),
    catchError((error: HttpErrorResponse) => {
    if (token && token !== auth.token()) return throwError(() => error);
    const code = error.error?.errorCode || error.error?.message;
    const serverText = SERVER_TEXT_CODES.has(error.error?.errorCode) && typeof error.error?.message === 'string' && !error.error.message.startsWith('error.') ? error.error.message : null;
    errors.fail(serverText ?? (typeof code === 'string' && code.startsWith('error.') ? code : error.status === 403 ? 'error.access.denied' : error.status === 401 ? 'error.auth.invalid' : error.status === 429 ? 'error.auth.rate_limit' : 'error.connection'));
    if (error.status === 401 && token && token === auth.token() && !request.url.endsWith('/auth/login')) { auth.logout(); void router.navigateByUrl('/login'); }
    return throwError(() => error);
  }));
};
