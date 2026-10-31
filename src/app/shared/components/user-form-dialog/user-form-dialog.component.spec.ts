import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { UserFormDialogComponent } from './user-form-dialog.component';
import { LocalizationService } from '../../../core/services/localization.service';
import { OrgAdminService } from '../../../core/services/org-admin.service';
import { OrgBranch, OrgUnitType, UserAccount } from '../../../core/models/org.models';

const node = (over: Partial<OrgBranch>): OrgBranch => ({
  id: 1, code: 'C', name: 'N', parentId: null, orgUnitType: OrgUnitType.Branch, companyId: null, isDefault: false, isActive: true, children: [], ...over
});
const branch = node({ id: 3, code: 'HN', name: 'Ha Noi', parentId: 2, companyId: 2 });
const company = node({ id: 2, code: 'CA', name: 'Company A', parentId: 1, orgUnitType: OrgUnitType.Company, companyId: 2, children: [branch] });
const group = node({ id: 1, code: 'root', name: 'Group', orgUnitType: OrgUnitType.Group, children: [company] });
const account = (over: Partial<UserAccount> = {}): UserAccount => ({ id: 7, userName: 'U1', displayName: 'User One', role: 'Viewer', branchIds: [3], isActive: true, ...over });

describe('UserFormDialogComponent', () => {
  let api: jasmine.SpyObj<OrgAdminService>;

  const create = (inputs: Partial<UserFormDialogComponent> = {}) => {
    const fixture = TestBed.createComponent(UserFormDialogComponent);
    Object.assign(fixture.componentInstance, { isSuperAdmin: false, ...inputs });
    fixture.componentInstance.branchTree = [group];
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(async () => {
    api = jasmine.createSpyObj<OrgAdminService>('OrgAdminService', ['employees', 'createUser', 'updateUser']);
    api.employees.and.returnValue(of({ items: [{ id: 11, code: 'E11', fullName: 'Employee Eleven' } as never], totalCount: 1, pageIndex: 1, pageSize: 200 }));
    api.createUser.and.returnValue(of(account()));
    api.updateUser.and.returnValue(of(account()));
    await TestBed.configureTestingModule({
      imports: [UserFormDialogComponent],
      providers: [
        { provide: OrgAdminService, useValue: api },
        { provide: LocalizationService, useValue: { currentLang: signal('vi'), translate: (key: string) => key } }
      ]
    }).compileComponents();
  });

  it('requires a password of at least 12 characters on create', () => {
    const fixture = create();
    const form = fixture.componentInstance.form;
    form.patchValue({ userName: 'new', displayName: 'New' });
    form.controls['password'].setValue('short');
    expect(form.controls['password'].invalid).toBeTrue();
    form.controls['password'].setValue('long-enough-pw');
    expect(form.valid).toBeTrue();
  });

  it('keeps the password optional when editing', () => {
    const fixture = create({ user: account() });
    expect(fixture.componentInstance.form.controls['password'].valid).toBeTrue();
    fixture.componentInstance.form.controls['password'].setValue('too short');
    expect(fixture.componentInstance.form.controls['password'].invalid).toBeTrue();
  });

  it('offers the Admin role only to a super administrator', () => {
    expect(create().componentInstance.roleOptions().map(o => o.value)).toEqual(['None', 'Viewer', 'Operator']);
    expect(create({ isSuperAdmin: true }).componentInstance.roleOptions().map(o => o.value)).toEqual(['None', 'Viewer', 'Operator', 'Admin']);
  });

  it('creates an account with the chosen employee and branches', () => {
    const fixture = create();
    const dialog = fixture.componentInstance;
    dialog.form.patchValue({ userName: ' new ', displayName: ' New One ', password: 'long-enough-pw', role: 'Viewer', employeeId: 11 });
    dialog.branchForm.controls['b_3'].setValue(true);
    spyOn(dialog.saved, 'emit');
    dialog.submit();
    expect(api.createUser).toHaveBeenCalledWith({ userName: 'new', displayName: 'New One', password: 'long-enough-pw', role: 'Viewer', branchIds: [3], employeeId: 11 });
    expect(dialog.saved.emit).toHaveBeenCalled();
  });

  it('locks the employee when opened from an employee row', () => {
    const fixture = create({ employee: { id: 11, code: 'E11', fullName: 'Employee Eleven' } });
    const dialog = fixture.componentInstance;
    expect(dialog.form.controls['employeeId'].disabled).toBeTrue();
    expect(dialog.form.getRawValue().displayName).toBe('Employee Eleven');
    dialog.form.patchValue({ userName: 'e11', password: 'long-enough-pw' });
    dialog.submit();
    expect(api.createUser).toHaveBeenCalledWith(jasmine.objectContaining({ employeeId: 11, userName: 'e11' }));
  });

  it('edits without the user name and sends the active flag, an empty password as null and an unlink as null', () => {
    const fixture = create({ user: account({ employeeId: 11, employeeCode: 'E11', employeeName: 'Employee Eleven', isActive: false }) });
    const dialog = fixture.componentInstance;
    expect(dialog.form.controls['userName'].disabled).toBeTrue();
    expect(dialog.employeeOptions().map(o => o.value)).toContain(11);
    dialog.form.patchValue({ employeeId: null });
    dialog.submit();
    expect(api.updateUser).toHaveBeenCalledWith(7, { displayName: 'User One', role: 'Viewer', branchIds: [3], isActive: false, password: null, employeeId: null });
  });
});
