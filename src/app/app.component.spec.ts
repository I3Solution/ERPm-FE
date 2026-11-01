import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DashboardService } from './core/services/dashboard.service';
import { LocalizationService } from './core/services/localization.service';
import { BranchService } from './core/services/branch.service';
import { BranchTreeSelectComponent } from './shared/components/branch-tree-select/branch-tree-select.component';
import { lineAmount, sumAmounts } from './core/money';
import { CustomSelectComponent } from './shared/components/custom-select/custom-select.component';
import { AuthService } from './core/services/auth.service';
import { ApiErrorService } from './core/services/api-error.service';
import { apiInterceptor } from './core/api.interceptor';
import { Router } from '@angular/router';

describe('MVP regression checks', () => {
  afterEach(() => TestBed.resetTestingModule());
  it('searches barcode metadata and emits a remote lookup query', async () => {
    TestBed.configureTestingModule({ imports: [CustomSelectComponent], providers: [{ provide: LocalizationService, useValue: { translate: (key: string) => key } }] });
    const fixture = TestBed.createComponent(CustomSelectComponent);
    fixture.componentInstance.options = [{ value: 51, label: 'Stock item', searchText: 'BARCODE987' }];
    fixture.componentInstance.searchable = true;
    let query = '';
    fixture.componentInstance.searchChange.subscribe(value => query = value);
    fixture.componentInstance.isOpen.set(true); fixture.detectChanges(); await fixture.whenStable();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.dropdown-search-input');
    input.value = 'BARCODE987'; input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges(); await fixture.whenStable();
    expect(query).toBe('BARCODE987');
    expect(fixture.componentInstance.filteredOptions()[0].value).toBe(51);
  });
  it('keeps a new login when a request from the previous session returns 401', () => {
    const token = signal('old-token'); const logout = jasmine.createSpy('logout');
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([apiInterceptor])), provideHttpClientTesting(),
      { provide: AuthService, useValue: { token, logout } }, 
      { provide: Router, useValue: { navigateByUrl: jasmine.createSpy('navigateByUrl') } }
    ] });
    TestBed.inject(HttpClient).get('/api/v1/items').subscribe({ error: () => {} });
    const request = TestBed.inject(HttpTestingController).expectOne('/api/v1/items');
    expect(request.request.headers.get('Authorization')).toBe('Bearer old-token');
    token.set('new-token'); request.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(logout).not.toHaveBeenCalled(); expect(TestBed.inject(ApiErrorService).message()).toBeNull();
  });
  it('rounds line amounts to four decimal places and sums decimal values', () => {
    expect(lineAmount(0.25, 12.3456)).toBe(3.0864);
    expect(lineAmount(1, 100, 20)).toBe(80);
    expect(sumAmounts([0.1, 0.2])).toBe(0.3);
  });
  it('shows a failed dashboard request as an error without demo revenue', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(DashboardService);
    service.loadMetrics();
    TestBed.inject(HttpTestingController).expectOne('/api/v1/dashboard/metrics').flush({}, { status: 500, statusText: 'Failed' });
    expect(service.error()).toBeTrue();
    expect(service.metrics().todaySales).toBe(0);
    expect(service.isLoading()).toBeFalse();
  });
  it('reads entries from the backend dictionary bundle', () => {
    localStorage.removeItem('erpm_dict_vi'); localStorage.removeItem('erpm_dict_en'); localStorage.setItem('erpm_lang', 'vi');
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(LocalizationService);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/localization/vi').flush({ success: true, data: { languageCode: 'vi', entries: { 'common.save': 'Database value' } } });
    http.expectOne('/api/v1/localization/en').flush({ success: true, data: { languageCode: 'en', entries: {} } });
    expect(service.translate('common.save')).toBe('Database value');
    expect(service.translate('auth.sign_in')).toBe('Đăng nhập');
    localStorage.removeItem('erpm_dict_vi'); localStorage.removeItem('erpm_dict_en');
  });
  it('searches the branch tree without writing signals inside computed', () => {
    const branch = { id: 1, code: 'ROOT', name: 'Root', isDefault: true, isActive: true, children: [{ id: 2, code: 'CHILD', name: 'Child', isDefault: false, isActive: true, children: [] }] };
    TestBed.configureTestingModule({ imports: [BranchTreeSelectComponent], providers: [
      { provide: BranchService, useValue: { branchTree: signal([branch]), currentBranch: signal(branch) } },
      { provide: LocalizationService, useValue: { translate: (key: string) => key } }
    ] });
    const fixture = TestBed.createComponent(BranchTreeSelectComponent);
    fixture.detectChanges();
    fixture.componentInstance.searchKeyword.set('child');
    expect(() => fixture.componentInstance.displayedTree()).not.toThrow();
    expect(fixture.componentInstance.displayedTree()[0].children?.[0].id).toBe(2);
    expect(fixture.componentInstance.isExpanded(1)).toBeTrue();
  });
});
