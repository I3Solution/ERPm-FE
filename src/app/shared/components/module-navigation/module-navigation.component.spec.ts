import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Account, AuthService } from '../../../core/services/auth.service';
import { LocalizationService } from '../../../core/services/localization.service';
import {
  NAVIGATION_PREFERENCE_STORAGE_PREFIX,
  NAVIGATION_PREFERENCE_VERSION,
  navigationPreferenceKey
} from '../../../core/services/navigation-preference.service';
import { ModuleNavigationComponent } from './module-navigation.component';

@Component({ standalone: true, template: '' })
class DummyRouteComponent {}

const TEST_ROUTES = [
  { path: 'dashboard', component: DummyRouteComponent },
  { path: 'more', component: DummyRouteComponent },
  { path: 'sales/orders', component: DummyRouteComponent },
  { path: 'sales/quotations', component: DummyRouteComponent },
  { path: 'inventory', component: DummyRouteComponent },
  { path: 'accounting/treasury', component: DummyRouteComponent }
];

function makeAccount(id: number, userName: string, permissions: string[], isSuperAdmin = false): Account {
  return {
    id,
    userName,
    displayName: userName,
    role: isSuperAdmin ? 'Admin' : 'Operator',
    branchIds: [1],
    isSuperAdmin,
    employeeId: null,
    companyId: 1,
    primaryBranchId: 1,
    departmentId: null,
    jobPositionId: null,
    permissions,
    readScope: { unrestricted: isSuperAdmin, branchIds: [1], departmentIds: [], ownRecords: false }
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

function labelText(labelKey: string): string {
  const i18n = TestBed.inject(LocalizationService);
  return i18n.dictionary()[labelKey] ?? labelKey;
}

function groupToggleButton(fixture: ComponentFixture<ModuleNavigationComponent>, labelKey: string): HTMLButtonElement {
  const expected = labelText(labelKey);
  const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.tree-toggle'));
  const match = buttons.find(btn => btn.textContent?.includes(expected));
  if (!match) {
    throw new Error(`Toggle button containing "${expected}" (${labelKey}) not found`);
  }
  return match;
}

describe('ModuleNavigationComponent', () => {
  beforeEach(() => {
    clearNavPreferenceKeys();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(TEST_ROUTES)]
    });
  });

  afterEach(() => clearNavPreferenceKeys());

  it('shares manual expand/collapse state across desktop sidebar and mobile More menu instances', async () => {
    const auth = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);
    auth.account.set(makeAccount(10, 'alice', [], true));
    await router.navigateByUrl('/more');

    const sidebarFixture = TestBed.createComponent(ModuleNavigationComponent);
    const moreFixture = TestBed.createComponent(ModuleNavigationComponent);
    sidebarFixture.detectChanges();
    moreFixture.detectChanges();

    expect(groupToggleButton(sidebarFixture, 'menu.warehouse_module').getAttribute('aria-expanded')).toBe('false');
    expect(groupToggleButton(moreFixture, 'menu.warehouse_module').getAttribute('aria-expanded')).toBe('false');

    // Expand Warehouse from mobile More menu; desktop sidebar updates immediately.
    groupToggleButton(moreFixture, 'menu.warehouse_module').click();
    moreFixture.detectChanges();
    sidebarFixture.detectChanges();

    expect(groupToggleButton(moreFixture, 'menu.warehouse_module').getAttribute('aria-expanded')).toBe('true');
    expect(groupToggleButton(sidebarFixture, 'menu.warehouse_module').getAttribute('aria-expanded')).toBe('true');

    // Collapse Warehouse from desktop sidebar; mobile More menu updates immediately.
    groupToggleButton(sidebarFixture, 'menu.warehouse_module').click();
    sidebarFixture.detectChanges();
    moreFixture.detectChanges();

    expect(groupToggleButton(sidebarFixture, 'menu.warehouse_module').getAttribute('aria-expanded')).toBe('false');
    expect(groupToggleButton(moreFixture, 'menu.warehouse_module').getAttribute('aria-expanded')).toBe('false');
  });

  it('ephemerally expands the active route branch without persisting it when toggling other groups', async () => {
    const auth = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);
    auth.account.set(makeAccount(20, 'alice', [], true));
    await router.navigateByUrl('/sales/orders');

    const fixture = TestBed.createComponent(ModuleNavigationComponent);
    fixture.detectChanges();

    // Direct route opens Sales temporarily without writing to localStorage.
    expect(fixture.componentInstance.activeGroup()).toBe('sales');
    expect(groupToggleButton(fixture, 'menu.sales_module').getAttribute('aria-expanded')).toBe('true');
    expect(localStorage.getItem(navigationPreferenceKey(20))).toBeNull();

    // Manually expanding Warehouse saves only Warehouse, never the auto-opened Sales branch.
    groupToggleButton(fixture, 'menu.warehouse_module').click();
    fixture.detectChanges();

    expect(JSON.parse(localStorage.getItem(navigationPreferenceKey(20))!)).toEqual({
      version: NAVIGATION_PREFERENCE_VERSION,
      expanded: ['warehouse']
    });

    // Leaving Sales closes Sales while keeping the manually expanded Warehouse group open.
    await router.navigateByUrl('/dashboard');
    fixture.detectChanges();

    expect(groupToggleButton(fixture, 'menu.sales_module').getAttribute('aria-expanded')).toBe('false');
    expect(groupToggleButton(fixture, 'menu.warehouse_module').getAttribute('aria-expanded')).toBe('true');
  });

  it('implements Option A when collapsing the active group and when reloading or re-entering the route', async () => {
    const auth = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);
    localStorage.setItem(
      navigationPreferenceKey(30),
      JSON.stringify({ version: NAVIGATION_PREFERENCE_VERSION, expanded: ['sales'] })
    );
    auth.account.set(makeAccount(30, 'alice', [], true));
    await router.navigateByUrl('/sales/orders');

    const fixture = TestBed.createComponent(ModuleNavigationComponent);
    fixture.detectChanges();
    expect(groupToggleButton(fixture, 'menu.sales_module').getAttribute('aria-expanded')).toBe('true');

    // Collapsing active Sales hides it immediately and removes it from persisted preference.
    groupToggleButton(fixture, 'menu.sales_module').click();
    fixture.detectChanges();
    expect(groupToggleButton(fixture, 'menu.sales_module').getAttribute('aria-expanded')).toBe('false');
    expect(JSON.parse(localStorage.getItem(navigationPreferenceKey(30))!)).toEqual({
      version: NAVIGATION_PREFERENCE_VERSION,
      expanded: []
    });

    // Navigating to another child inside Sales keeps it collapsed.
    await router.navigateByUrl('/sales/quotations');
    fixture.detectChanges();
    expect(groupToggleButton(fixture, 'menu.sales_module').getAttribute('aria-expanded')).toBe('false');

    // Leaving Sales and returning re-expands Sales temporarily without persisting it.
    await router.navigateByUrl('/dashboard');
    fixture.detectChanges();
    await router.navigateByUrl('/sales/orders');
    fixture.detectChanges();
    expect(groupToggleButton(fixture, 'menu.sales_module').getAttribute('aria-expanded')).toBe('true');
    expect(JSON.parse(localStorage.getItem(navigationPreferenceKey(30))!)).toEqual({
      version: NAVIGATION_PREFERENCE_VERSION,
      expanded: []
    });

    // Collapsing again and simulating a page reload at /sales/orders re-expands Sales temporarily.
    groupToggleButton(fixture, 'menu.sales_module').click();
    fixture.detectChanges();
    expect(groupToggleButton(fixture, 'menu.sales_module').getAttribute('aria-expanded')).toBe('false');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(TEST_ROUTES)]
    });
    const reloadedAuth = TestBed.inject(AuthService);
    const reloadedRouter = TestBed.inject(Router);
    reloadedAuth.account.set(makeAccount(30, 'alice', [], true));
    await reloadedRouter.navigateByUrl('/sales/orders');
    const reloadedFixture = TestBed.createComponent(ModuleNavigationComponent);
    reloadedFixture.detectChanges();
    expect(groupToggleButton(reloadedFixture, 'menu.sales_module').getAttribute('aria-expanded')).toBe('true');
    expect(JSON.parse(localStorage.getItem(navigationPreferenceKey(30))!)).toEqual({
      version: NAVIGATION_PREFERENCE_VERSION,
      expanded: []
    });
  });

  it('hides groups without permission and ignores deleted group IDs from storage', async () => {
    const auth = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);
    localStorage.setItem(
      navigationPreferenceKey(40),
      JSON.stringify({
        version: NAVIGATION_PREFERENCE_VERSION,
        expanded: ['sales', 'accounting', 'deleted_group']
      })
    );
    auth.account.set(makeAccount(40, 'limited', ['sd:order:view', 'wms:item:view'], false));
    await router.navigateByUrl('/dashboard');

    const fixture = TestBed.createComponent(ModuleNavigationComponent);
    fixture.detectChanges();

    const rootText = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(rootText).toContain(labelText('menu.sales_module'));
    expect(rootText).toContain(labelText('menu.warehouse_module'));
    expect(rootText).not.toContain(labelText('menu.accounting'));
    expect(Array.from(fixture.componentInstance.expanded())).toEqual(['sales']);
  });

  it('switches preferences cleanly between two accounts on the same browser', async () => {
    const auth = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/dashboard');

    const fixture = TestBed.createComponent(ModuleNavigationComponent);

    // Account A expands Sales.
    auth.account.set(makeAccount(51, 'userA', [], true));
    fixture.detectChanges();
    groupToggleButton(fixture, 'menu.sales_module').click();
    fixture.detectChanges();
    expect(groupToggleButton(fixture, 'menu.sales_module').getAttribute('aria-expanded')).toBe('true');

    // Account B signs in on the same browser: Sales is closed, Account B expands HR.
    auth.logout();
    auth.account.set(makeAccount(52, 'userB', [], true));
    fixture.detectChanges();
    expect(groupToggleButton(fixture, 'menu.sales_module').getAttribute('aria-expanded')).toBe('false');
    groupToggleButton(fixture, 'menu.hr_module').click();
    fixture.detectChanges();
    expect(groupToggleButton(fixture, 'menu.hr_module').getAttribute('aria-expanded')).toBe('true');

    // Account A signs back in: Sales is open, HR is closed.
    auth.logout();
    auth.account.set(makeAccount(51, 'userA', [], true));
    fixture.detectChanges();
    expect(groupToggleButton(fixture, 'menu.sales_module').getAttribute('aria-expanded')).toBe('true');
    expect(groupToggleButton(fixture, 'menu.hr_module').getAttribute('aria-expanded')).toBe('false');
  });
});
