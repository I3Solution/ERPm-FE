import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { RolesComponent } from './roles.component';
import { Account, AuthService } from '../../../core/services/auth.service';
import { LocalizationService } from '../../../core/services/localization.service';
import { OrgAdminService } from '../../../core/services/org-admin.service';
import { EffectivePermission, PermissionCatalogItem, Role, UserAccount } from '../../../core/models/org.models';

const item = (module: string, resource: string, verb: string): PermissionCatalogItem =>
  ({ action: `${module}:${resource}:${verb}`, module, resource: `${module}:${resource}`, verb });
const catalog = [item('sd', 'order', 'view'), item('sd', 'order', 'edit'), item('wms', 'stock', 'view')];
const role = (over: Partial<Role>): Role => ({
  id: 1, code: 'SALES', name: 'Sales', description: null, translations: {}, companyId: 7, isSystemRole: false, isActive: true, version: 11,
  policyDocument: { version: '1', statements: [{ sid: 'Allow', effect: 'Allow', actions: ['sd:order:view'], dataScope: { mode: 'BRANCH' } }] }, ...over
});

describe('RolesComponent', () => {
  const granted = new Set<string>();
  let api: jasmine.SpyObj<OrgAdminService>;

  const create = () => {
    const fixture = TestBed.createComponent(RolesComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(async () => {
    granted.clear();
    ['sys:role:view', 'sys:role:create', 'sys:role:edit', 'sys:role:delete', 'sys:user:view'].forEach(a => granted.add(a));
    api = jasmine.createSpyObj<OrgAdminService>('OrgAdminService',
      ['roles', 'permissionCatalog', 'branchTree', 'users', 'createRole', 'updateRole', 'deleteRole', 'userAccess', 'setUserAccess', 'userEffective']);
    api.roles.and.returnValue(of([role({}), role({ id: 2, code: 'ADMIN', name: 'Admin', isSystemRole: true, companyId: null })]));
    api.permissionCatalog.and.returnValue(of(catalog));
    api.branchTree.and.returnValue(of([]));
    api.users.and.returnValue(of([{ id: 5, userName: 'ANH', displayName: 'Anh', role: 'None', branchIds: [], isActive: true } as UserAccount]));
    api.updateRole.and.callFake((_id, request) => of(role({ ...request, id: 1, version: 12 } as Partial<Role>)));
    api.createRole.and.callFake((request) => of(role({ ...request, id: 9 } as Partial<Role>)));
    await TestBed.configureTestingModule({
      imports: [RolesComponent],
      providers: [
        { provide: OrgAdminService, useValue: api },
        { provide: AuthService, useValue: { can: (a: string) => granted.has(a), account: () => ({ companyId: 7 } as Partial<Account>) } },
        { provide: LocalizationService, useValue: { currentLang: signal('vi'), translate: (key: string) => key } }
      ]
    }).compileComponents();
  });

  it('lists the roles and opens the selected one in the matrix', () => {
    const component = create().componentInstance;
    expect(component.roles().length).toBe(2);
    component.select(component.roles()[0]);
    expect(component.mode()).toBe('matrix');
    expect(component.isAllowed('sd:order:view')).toBeTrue();
    expect(component.form.controls.scopeMode.value).toBe('BRANCH');
  });

  it('saves matrix changes with the version read earlier', () => {
    const component = create().componentInstance;
    component.select(component.roles()[0]);
    component.toggleAllow('wms:stock:view');
    component.toggleDeny('sd:order:view');
    component.save();
    const [id, request] = api.updateRole.calls.mostRecent().args;
    expect(id).toBe(1);
    expect(request.version).toBe(11);
    expect(request.policyDocument.statements.map(s => [s.effect, s.actions])).toEqual([['Allow', ['wms:stock:view']], ['Deny', ['sd:order:view']]]);
  });

  it('keeps one action out of both the allow and deny sets', () => {
    const component = create().componentInstance;
    component.select(component.roles()[0]);
    component.toggleDeny('sd:order:view');
    expect(component.isDenied('sd:order:view')).toBeTrue();
    expect(component.isAllowed('sd:order:view')).toBeFalse();
    component.toggleAllow('sd:order:view');
    expect(component.isAllowed('sd:order:view') && !component.isDenied('sd:order:view')).toBeTrue();
  });

  it('copies a role into an unsaved new role and creates it without a version', () => {
    const component = create().componentInstance;
    component.copy(component.roles()[0]);
    expect(component.draft()?.id).toBe(0);
    expect(component.form.controls.code.value).toBe('SALES_COPY');
    expect(component.isAllowed('sd:order:view')).toBeTrue();
    component.save();
    expect(api.createRole).toHaveBeenCalled();
    expect(api.createRole.calls.mostRecent().args[0].version).toBeNull();
  });

  it('does not allow editing a system role', () => {
    const component = create().componentInstance;
    component.select(component.roles()[1]);
    expect(component.readOnly()).toBeTrue();
    component.toggleAllow('sd:order:edit');
    component.save();
    expect(component.isAllowed('sd:order:edit')).toBeFalse();
    expect(api.updateRole).not.toHaveBeenCalled();
  });

  it('opens an advanced policy in JSON mode and refuses to switch back when the matrix cannot show it', () => {
    const component = create().componentInstance;
    component.select(role({ policyDocument: { version: '1', statements: [{ effect: 'Allow', actions: ['sd:*'] }] } }));
    expect(component.mode()).toBe('json');
    expect(component.matrixEditable()).toBeFalse();
    component.switchMode('matrix');
    expect(component.mode()).toBe('json');
    expect(component.jsonError()).toBe('role.json.not_matrix');
  });

  it('rejects invalid JSON instead of saving it', () => {
    const component = create().componentInstance;
    component.select(role({ policyDocument: { version: '1', statements: [{ effect: 'Allow', actions: ['sd:*'] }] } }));
    component.form.controls.json.setValue('{ not json');
    component.save();
    expect(component.jsonError()).toBe('role.json.invalid');
    expect(api.updateRole).not.toHaveBeenCalled();
  });

  it('loads the effective access of an account and separates denied from allowed', () => {
    const rows: EffectivePermission[] = [
      { ...item('sd', 'order', 'view'), status: 'Denied', sources: [{ source: 'inline-policy', sid: 'NoOrders', effect: 'Deny' }] },
      { ...item('wms', 'stock', 'view'), status: 'Allowed', sources: [{ source: 'job-position:SALES', effect: 'Allow' }] },
      { ...item('sd', 'order', 'edit'), status: 'NotGranted', sources: [] }
    ];
    api.userAccess.and.returnValue(of({ userId: 5, roles: [], inlinePolicy: null }));
    api.userEffective.and.returnValue(of(rows));
    const component = create().componentInstance;
    component.accountControl.setValue(5);
    expect(component.effectiveCounts()).toEqual({ allowed: 1, denied: 1 });
    component.effectiveFilter.set('Denied');
    expect(component.effectiveGroups().map(g => g.items.map(i => i.action))).toEqual([['sd:order:view']]);
    expect(component.sourceLabel('job-position:SALES')).toBe('role.source.job-position: SALES');
  });

  it('assigns an extra role and saves the inline policy of an account', () => {
    api.userAccess.and.returnValue(of({ userId: 5, roles: [], inlinePolicy: null }));
    api.userEffective.and.returnValue(of([]));
    api.setUserAccess.and.callFake((_id, request) => of(request));
    const component = create().componentInstance;
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
});
