import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { apiInterceptor } from './api.interceptor';
import { AuthService } from './services/auth.service';
import { ApiErrorService } from './services/api-error.service';

describe('apiInterceptor error banner', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let errors: ApiErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { token: signal<string | null>(null), logout: () => undefined } },
        { provide: Router, useValue: { navigateByUrl: () => Promise.resolve(true) } }
      ]
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    errors = TestBed.inject(ApiErrorService);
  });

  afterEach(() => backend.verify());

  it('shows the error of a failed request and clears it when the next request succeeds', () => {
    http.post('/api/v1/auth/login', {}).subscribe({ error: () => undefined });
    backend.expectOne('/api/v1/auth/login').flush({ errorCode: 'error.auth.invalid' }, { status: 401, statusText: 'Unauthorized' });
    expect(errors.message()).toBe('error.auth.invalid');

    http.get('/api/v1/branches').subscribe();
    backend.expectOne('/api/v1/branches').flush({ data: [] });
    expect(errors.message()).toBeNull();
  });

  it('keeps the banner while the failing request is the latest one', () => {
    http.get('/api/v1/branches').subscribe({ error: () => undefined });
    backend.expectOne('/api/v1/branches').flush({}, { status: 500, statusText: 'Server Error' });
    expect(errors.message()).toBe('error.connection');
  });

  it('ignores requests that are not API calls', () => {
    errors.message.set('error.connection');
    http.get('/assets/i18n/system.json').subscribe();
    backend.expectOne('/assets/i18n/system.json').flush({});
    expect(errors.message()).toBe('error.connection');
  });
});
