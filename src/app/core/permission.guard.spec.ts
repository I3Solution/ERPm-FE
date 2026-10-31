import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { permissionGuard } from './permission.guard';
import { Account, AuthService } from './services/auth.service';

describe('permissionGuard', () => {
  let router: Router;
  let state: { isAuthenticated: () => boolean; account: ReturnType<typeof signal<Account | null>>; can: (a: string) => boolean; canAny: (a: string[]) => boolean; loadAccount: jasmine.Spy };

  const run = (...actions: string[]) =>
    TestBed.runInInjectionContext(() => permissionGuard(...actions)({} as never, {} as never));
  const urlOf = (result: unknown) => router.serializeUrl(result as UrlTree);

  beforeEach(() => {
    const granted = new Set<string>();
    state = {
      isAuthenticated: () => true,
      account: signal<Account | null>({ permissions: [] } as unknown as Account),
      can: (action: string) => granted.has(action),
      canAny: (actions: string[]) => actions.some(a => granted.has(a)),
      loadAccount: jasmine.createSpy('loadAccount')
    };
    (state as unknown as { grant: (a: string) => void }).grant = (a: string) => granted.add(a);
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: state }] });
    router = TestBed.inject(Router);
  });
  const grant = (action: string) => (state as unknown as { grant: (a: string) => void }).grant(action);

  it('sends signed-out users to /login', () => {
    state.isAuthenticated = () => false;
    expect(urlOf(run('sd:order:view'))).toBe('/login');
  });

  it('lets an account with the permission through', () => {
    grant('sd:order:view');
    expect(run('sd:order:view')).toBeTrue();
  });

  it('allows access when any of several actions is granted', () => {
    grant('wms:item:view');
    expect(run('sd:order:view', 'wms:item:view')).toBeTrue();
  });

  it('sends an account without the permission to /forbidden', () => {
    expect(urlOf(run('sys:role:view'))).toBe('/forbidden');
  });

  it('loads the account first after a page refresh, then decides', done => {
    grant('crm:partner:view');
    state.account = signal<Account | null>(null);
    state.loadAccount.and.returnValue(of({}));
    (run('crm:partner:view') as Observable<unknown>).subscribe(result => { expect(result).toBeTrue(); done(); });
  });

  it('falls back to /login when /auth/me fails', done => {
    state.account = signal<Account | null>(null);
    state.loadAccount.and.returnValue(throwError(() => new Error('401')));
    (run('crm:partner:view') as Observable<unknown>).subscribe(result => { expect(urlOf(result)).toBe('/login'); done(); });
  });
});
