import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Account, AuthService } from './auth.service';

const account = (overrides: Partial<Account> = {}): Account => ({
  id: 1, userName: 'USER', displayName: 'User', role: 'None', branchIds: [], isSuperAdmin: false,
  employeeId: null, companyId: null, primaryBranchId: null, departmentId: null, jobPositionId: null,
  permissions: [], readScope: { unrestricted: false, branchIds: [], departmentIds: [], ownRecords: false }, ...overrides
});

describe('AuthService permissions', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  it('denies everything before the account is loaded', () => {
    expect(auth.can('sd:order:view')).toBeFalse();
    expect(auth.canAny(['sd:order:view', 'wms:item:view'])).toBeFalse();
  });

  it('grants only the actions listed by /auth/me', () => {
    auth.account.set(account({ permissions: ['sd:order:view', 'wms:item:view'] }));
    expect(auth.can('sd:order:view')).toBeTrue();
    expect(auth.can('sd:order:edit')).toBeFalse();
    expect(auth.canAny(['sd:order:edit', 'wms:item:view'])).toBeTrue();
  });

  it('lets a super administrator do everything', () => {
    auth.account.set(account({ isSuperAdmin: true, role: 'Admin' }));
    expect(auth.can('sys:role:delete')).toBeTrue();
  });

  it('stores permissions and read scope from /auth/me and clears them on logout', () => {
    auth.loadAccount().subscribe();
    http.expectOne('/api/v1/auth/me').flush({ data: account({ permissions: ['crm:partner:view'], readScope: { unrestricted: false, branchIds: [2, 3], departmentIds: [], ownRecords: true } }) });
    expect(auth.can('crm:partner:view')).toBeTrue();
    expect(auth.readScope()?.branchIds).toEqual([2, 3]);
    auth.logout();
    expect(auth.can('crm:partner:view')).toBeFalse();
    expect(auth.readScope()).toBeNull();
  });
});
