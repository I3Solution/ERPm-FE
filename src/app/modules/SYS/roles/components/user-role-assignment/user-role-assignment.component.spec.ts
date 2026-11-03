import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { UserRoleAssignmentComponent } from './user-role-assignment.component';
import { LocalizationService } from '../../../../../core/services/localization.service';
import { Role } from '../../../../../core/models/org.models';

const role = (id: number, isActive = true): Role => ({
  id, code: `R${id}`, name: `Role ${id}`, description: null, translations: {}, companyId: 7, isSystemRole: false, isActive, version: 1,
  policyDocument: { version: '1', statements: [] }
});

describe('UserRoleAssignmentComponent', () => {
  const create = (canEdit: boolean) => {
    const fixture = TestBed.createComponent(UserRoleAssignmentComponent);
    fixture.componentRef.setInput('roles', [role(1), role(2, false)]);
    fixture.componentRef.setInput('access', { userId: 5, roles: [{ roleId: 1 }], inlinePolicy: null });
    fixture.componentRef.setInput('inlineControl', new FormControl('', { nonNullable: true }));
    fixture.componentRef.setInput('canEdit', canEdit);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRoleAssignmentComponent],
      providers: [{ provide: LocalizationService, useValue: { currentLang: signal('vi'), translate: (key: string) => key } }]
    }).compileComponents();
  });

  it('ticks the roles already assigned and disables inactive roles', () => {
    const boxes: HTMLInputElement[] = [...create(true).nativeElement.querySelectorAll('.role-checks input')];
    expect(boxes.map(b => b.checked)).toEqual([true, false]);
    expect(boxes.map(b => b.disabled)).toEqual([false, true]);
  });

  it('emits the toggled role and the save request, and hides saving without edit rights', () => {
    const fixture = create(true);
    const toggled: number[] = [];
    let saves = 0;
    fixture.componentInstance.roleToggle.subscribe(id => toggled.push(id));
    fixture.componentInstance.save.subscribe(() => saves++);
    fixture.nativeElement.querySelector('.role-checks input').click();
    fixture.nativeElement.querySelector('.role-actions button').click();
    expect(toggled).toEqual([1]);
    expect(saves).toBe(1);
    expect(create(false).nativeElement.querySelector('.role-actions')).toBeNull();
  });
});
