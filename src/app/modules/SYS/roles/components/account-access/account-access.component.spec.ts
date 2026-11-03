import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AccountAccessComponent } from './account-access.component';
import { AuthService } from '../../../../../core/services/auth.service';
import { LocalizationService } from '../../../../../core/services/localization.service';
import { OrgAdminService } from '../../../../../core/services/org-admin.service';
import { Role, UserAccount } from '../../../../../core/models/org.models';

const role = (over: Partial<Role>): Role => ({
  id: 1, code: 'SALES', name: 'Sales', description: null, translations: {}, companyId: 7, isSystemRole: false, isActive: true, version: 11,
  policyDocument: { version: '1', statements: [] }, ...over
});

describe('AccountAccessComponent', () => {
  const granted = new Set<string>();
  let api: jasmine.SpyObj<OrgAdminService>;

  const create = () => {
    const fixture = TestBed.createComponent(AccountAccessComponent);
    fixture.componentRef.setInput('roles', [role({})]);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  beforeEach(async () => {
    granted.clear();
    ['sys:role:view', 'sys:role:edit', 'sys:user:view'].forEach(a => granted.add(a));
    api = jasmine.createSpyObj<OrgAdminService>('OrgAdminService', ['users', 'userAccess', 'setUserAccess', 'userEffective']);
    api.users.and.returnValue(of([{ id: 5, userName: 'ANH', displayName: 'Anh', role: 'None', branchIds: [], isActive: true } as UserAccount]));
    api.userAccess.and.returnValue(of({ userId: 5, roles: [], inlinePolicy: null }));
    api.userEffective.and.returnValue(of([]));
    api.setUserAccess.and.callFake((_id, request) => of(request));
    await TestBed.configureTestingModule({
      imports: [AccountAccessComponent],
      providers: [
        { provide: OrgAdminService, useValue: api },
        { provide: AuthService, useValue: { can: (a: string) => granted.has(a) } },
        { provide: LocalizationService, useValue: { currentLang: signal('vi'), translate: (key: string) => key } }
      ]
    }).compileComponents();
  });

  it('offers the accounts the caller may view', () => {
    expect(create().accountOptions()).toEqual([{ value: 5, label: 'ANH - Anh' }]);
  });

  it('does not load accounts without sys:user:view', () => {
    granted.delete('sys:user:view');
    create();
    expect(api.users).not.toHaveBeenCalled();
  });

  it('loads the access and the effective rows of the picked account', () => {
    const component = create();
    component.accountControl.setValue(5);
    expect(api.userAccess).toHaveBeenCalledWith(5);
    expect(api.userEffective).toHaveBeenCalledWith(5);
    expect(component.access()?.userId).toBe(5);
  });

  it('assigns an extra role and saves the inline policy of an account', () => {
    const component = create();
    component.accountControl.setValue(5);
    component.toggleExtraRole(1);
    component.inlineControl.setValue('{"version":"1","statements":[]}');
    component.saveAccess();
    const [id, request] = api.setUserAccess.calls.mostRecent().args;
    expect(id).toBe(5);
    expect(request.roles).toEqual([{ roleId: 1 }]);
    expect(request.inlinePolicy).toEqual({ version: '1', statements: [] });
    component.inlineControl.setValue('oops');
    component.saveAccess();
    expect(component.inlineError()).toBe('role.json.invalid');
  });

  it('does not change extra roles without sys:role:edit', () => {
    granted.delete('sys:role:edit');
    const component = create();
    component.accountControl.setValue(5);
    component.toggleExtraRole(1);
    expect(component.hasExtraRole(1)).toBeFalse();
  });
});
