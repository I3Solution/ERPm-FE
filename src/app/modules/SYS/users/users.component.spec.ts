import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { UsersComponent } from './users.component';
import { Account, AuthService } from '../../../core/services/auth.service';
import { LocalizationService } from '../../../core/services/localization.service';
import { OrgAdminService } from '../../../core/services/org-admin.service';
import { UserAccount } from '../../../core/models/org.models';

const user = (over: Partial<UserAccount>): UserAccount => ({ id: 1, userName: 'U1', displayName: 'User One', role: 'None', branchIds: [], isActive: true, ...over });

describe('UsersComponent', () => {
  const granted = new Set<string>();
  let api: jasmine.SpyObj<OrgAdminService>;

  const create = () => {
    const fixture = TestBed.createComponent(UsersComponent);
    fixture.detectChanges();
    return fixture;
  };
  const cells = (fixture: ReturnType<typeof create>, column: number) =>
    [...fixture.nativeElement.querySelectorAll('tbody tr')].map((tr: Element) => tr.querySelectorAll('td')[column]?.textContent?.trim());

  beforeEach(async () => {
    granted.clear();
    api = jasmine.createSpyObj<OrgAdminService>('OrgAdminService', ['users', 'branchTree', 'employees', 'createUser', 'updateUser']);
    api.users.and.returnValue(of([
      user({ id: 1, userName: 'ADMIN', displayName: 'Administrator', role: 'Admin' }),
      user({ id: 2, userName: 'ANH', displayName: 'Anh Nguyen', employeeId: 5, employeeCode: 'E5', employeeName: 'Anh Nguyen', isActive: false })
    ]));
    api.branchTree.and.returnValue(of([]));
    api.employees.and.returnValue(of({ items: [], totalCount: 0, pageIndex: 1, pageSize: 200 }));
    await TestBed.configureTestingModule({
      imports: [UsersComponent],
      providers: [
        { provide: OrgAdminService, useValue: api },
        { provide: AuthService, useValue: { can: (a: string) => granted.has(a), account: () => ({ isSuperAdmin: false } as Partial<Account>) } },
        { provide: LocalizationService, useValue: { currentLang: signal('vi'), translate: (key: string) => key } }
      ]
    }).compileComponents();
  });

  it('shows the linked employee and the active state of each account', () => {
    const fixture = create();
    expect(cells(fixture, 0)).toEqual(['ADMIN', 'ANH']);
    expect(cells(fixture, 3)).toEqual(['', 'E5 - Anh Nguyen']);
    expect(cells(fixture, 4)).toEqual(['common.active', 'common.inactive']);
  });

  it('filters by user name, display name or employee', () => {
    const fixture = create();
    fixture.componentInstance.keywordControl.setValue('e5');
    fixture.detectChanges();
    expect(cells(fixture, 0)).toEqual(['ANH']);
  });

  it('gates the create and edit buttons by permission', () => {
    let fixture = create();
    expect(fixture.nativeElement.querySelector('.erpm-page-header button')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('tbody button').length).toBe(0);
    fixture.destroy();
    granted.add('sys:user:create'); granted.add('sys:user:edit');
    fixture = create();
    expect(fixture.nativeElement.querySelector('.erpm-page-header button')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('tbody button').length).toBe(2);
  });

  it('opens the dialog empty to create and with the account to edit', () => {
    granted.add('sys:user:create'); granted.add('sys:user:edit');
    const fixture = create();
    fixture.componentInstance.openCreate();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-user-form-dialog')).not.toBeNull();
    expect(fixture.componentInstance.dialogUser()).toBeNull();
    fixture.componentInstance.closeDialog();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-user-form-dialog')).toBeNull();
    fixture.componentInstance.openEdit(fixture.componentInstance.users()[1]);
    expect(fixture.componentInstance.dialogUser()?.userName).toBe('ANH');
  });
});
