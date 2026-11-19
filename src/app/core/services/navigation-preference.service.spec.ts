import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Account, AuthService } from './auth.service';
import {
  NAVIGATION_PREFERENCE_STORAGE_PREFIX,
  NAVIGATION_PREFERENCE_VERSION,
  NavigationPreferenceService,
  navigationPreferenceKey
} from './navigation-preference.service';

function makeAccount(id: number, userName: string, permissions: string[] = []): Account {
  return {
    id,
    userName,
    displayName: userName,
    role: 'Operator',
    branchIds: [1],
    isSuperAdmin: false,
    employeeId: null,
    companyId: 1,
    primaryBranchId: 1,
    departmentId: null,
    jobPositionId: null,
    permissions,
    readScope: { unrestricted: false, branchIds: [1], departmentIds: [], ownRecords: false }
  };
}

function clearNavPreferenceKeys(): void {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(NAVIGATION_PREFERENCE_STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
}

describe('NavigationPreferenceService', () => {
  const validGroups = new Set(['sales', 'warehouse', 'accounting', 'hr', 'admin']);

  beforeEach(() => {
    clearNavPreferenceKeys();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
  });

  afterEach(() => clearNavPreferenceKeys());

  it('persists versioned expanded groups per account and restores after reload', () => {
    const auth = TestBed.inject(AuthService);
    const svc = TestBed.inject(NavigationPreferenceService);

    auth.account.set(makeAccount(101, 'alice'));
    expect(Array.from(svc.expandedGroups())).toEqual([]);

    svc.setGroupExpanded('sales', true, validGroups);
    svc.setGroupExpanded('hr', true, validGroups);
    expect(Array.from(svc.expandedGroups()).sort()).toEqual(['hr', 'sales']);

    const storedRaw = localStorage.getItem(navigationPreferenceKey(101));
    expect(storedRaw).not.toBeNull();
    expect(JSON.parse(storedRaw!)).toEqual({
      version: NAVIGATION_PREFERENCE_VERSION,
      expanded: ['sales', 'hr']
    });

    // Simulate a fresh app reload with a brand new injector.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    const reloadedAuth = TestBed.inject(AuthService);
    const reloadedSvc = TestBed.inject(NavigationPreferenceService);
    expect(Array.from(reloadedSvc.expandedGroups())).toEqual([]);

    reloadedAuth.account.set(makeAccount(101, 'alice'));
    expect(Array.from(reloadedSvc.expandedGroups()).sort()).toEqual(['hr', 'sales']);
  });

  it('isolates preferences across two accounts on the same browser and preserves storage on logout', () => {
    const auth = TestBed.inject(AuthService);
    const svc = TestBed.inject(NavigationPreferenceService);

    auth.account.set(makeAccount(101, 'alice'));
    svc.setGroupExpanded('sales', true, validGroups);
    expect(Array.from(svc.expandedGroups())).toEqual(['sales']);

    // Logout clears in-memory state without deleting Alice's persisted entry.
    auth.logout();
    expect(Array.from(svc.expandedGroups())).toEqual([]);
    expect(localStorage.getItem(navigationPreferenceKey(101))).not.toBeNull();

    // Second account on the same browser starts clean and saves its own choice.
    auth.account.set(makeAccount(202, 'bob'));
    expect(Array.from(svc.expandedGroups())).toEqual([]);
    svc.setGroupExpanded('accounting', true, validGroups);
    expect(Array.from(svc.expandedGroups())).toEqual(['accounting']);

    // Switching back to Alice restores only Alice's groups.
    auth.logout();
    auth.account.set(makeAccount(101, 'alice'));
    expect(Array.from(svc.expandedGroups())).toEqual(['sales']);
  });

  it('prunes deleted group IDs and ignores unknown groups on write', () => {
    const auth = TestBed.inject(AuthService);
    const svc = TestBed.inject(NavigationPreferenceService);

    localStorage.setItem(
      navigationPreferenceKey(101),
      JSON.stringify({ version: NAVIGATION_PREFERENCE_VERSION, expanded: ['sales', 'removed_module'] })
    );
    auth.account.set(makeAccount(101, 'alice'));

    svc.setGroupExpanded('unknown_group', true, validGroups);
    svc.setGroupExpanded('warehouse', true, validGroups);

    expect(Array.from(svc.expandedGroups()).sort()).toEqual(['sales', 'warehouse']);
    expect(JSON.parse(localStorage.getItem(navigationPreferenceKey(101))!)).toEqual({
      version: NAVIGATION_PREFERENCE_VERSION,
      expanded: ['sales', 'warehouse']
    });
  });

  it('handles corrupted, legacy, or unsupported version storage payloads safely', () => {
    const auth = TestBed.inject(AuthService);
    const svc = TestBed.inject(NavigationPreferenceService);

    const invalidPayloads = [
      '{not-json',
      '["sales"]',
      JSON.stringify({ version: 0, expanded: ['sales'] }),
      JSON.stringify({ version: 99, expanded: ['sales'] }),
      JSON.stringify({ version: NAVIGATION_PREFERENCE_VERSION, expanded: 'sales' }),
      'null'
    ];

    invalidPayloads.forEach((payload, index) => {
      const id = 300 + index;
      localStorage.setItem(navigationPreferenceKey(id), payload);
      auth.account.set(makeAccount(id, `user${id}`));
      expect(Array.from(svc.expandedGroups())).toEqual([]);
    });

    // Partially valid entries inside v1 payload keep only non-empty strings.
    localStorage.setItem(
      navigationPreferenceKey(400),
      JSON.stringify({ version: NAVIGATION_PREFERENCE_VERSION, expanded: ['sales', '', 123, null, 'sales'] })
    );
    auth.account.set(makeAccount(400, 'partial'));
    expect(Array.from(svc.expandedGroups())).toEqual(['sales']);
  });

  it('keeps working in memory when localStorage access is blocked', () => {
    const auth = TestBed.inject(AuthService);
    const svc = TestBed.inject(NavigationPreferenceService);

    spyOn(Storage.prototype, 'getItem').and.throwError('SecurityError');
    spyOn(Storage.prototype, 'setItem').and.throwError('QuotaExceededError');

    auth.account.set(makeAccount(501, 'blocked'));
    expect(Array.from(svc.expandedGroups())).toEqual([]);

    expect(() => svc.setGroupExpanded('warehouse', true, validGroups)).not.toThrow();
    expect(Array.from(svc.expandedGroups())).toEqual(['warehouse']);
  });

  it('tracks ephemeral suppression for an active route group without polluting storage', () => {
    const auth = TestBed.inject(AuthService);
    const svc = TestBed.inject(NavigationPreferenceService);

    auth.account.set(makeAccount(601, 'alice'));
    svc.setGroupExpanded('sales', false, validGroups, 'sales');

    expect(svc.isActiveGroupSuppressed('sales')).toBeTrue();
    expect(localStorage.getItem(navigationPreferenceKey(601))).toBeNull();

    // Navigating away from sales clears suppression.
    svc.syncActiveGroup(undefined);
    expect(svc.isActiveGroupSuppressed('sales')).toBeFalse();

    // Re-suppressing and then explicitly expanding clears suppression and persists.
    svc.setGroupExpanded('sales', false, validGroups, 'sales');
    expect(svc.isActiveGroupSuppressed('sales')).toBeTrue();
    svc.setGroupExpanded('sales', true, validGroups, 'sales');
    expect(svc.isActiveGroupSuppressed('sales')).toBeFalse();
    expect(Array.from(svc.expandedGroups())).toEqual(['sales']);
  });

  it('syncs changes from another browser tab via the storage event', () => {
    const auth = TestBed.inject(AuthService);
    const svc = TestBed.inject(NavigationPreferenceService);

    auth.account.set(makeAccount(701, 'alice'));
    expect(Array.from(svc.expandedGroups())).toEqual([]);

    const key = navigationPreferenceKey(701);
    const payload = JSON.stringify({ version: NAVIGATION_PREFERENCE_VERSION, expanded: ['hr'] });
    localStorage.setItem(key, payload);
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: payload }));

    expect(Array.from(svc.expandedGroups())).toEqual(['hr']);
  });
});
