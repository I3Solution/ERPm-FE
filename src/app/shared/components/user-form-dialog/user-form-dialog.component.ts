import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LocalizationService } from '../../../core/services/localization.service';
import { OrgAdminService } from '../../../core/services/org-admin.service';
import { Employee, OrgBranch, OrgUnitType, UserAccount } from '../../../core/models/org.models';
import { FormControlComponent } from '../form-control/form-control.component';
import { SelectOption } from '../custom-select/custom-select.component';
import { TranslatePipe } from '../../pipes/translate.pipe';

/** The employee an account is created for; when set the picker is locked to it. */
export interface DialogEmployee { id: number; code: string; fullName: string; }

/**
 * Create or edit an internal account. Used by the user list and by "Cấp tài khoản" on an employee. A company
 * administrator must link an employee on create (the server enforces it); only a super administrator may leave it empty.
 */
@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, FormControlComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-form-dialog.component.html',
  styleUrls: ['./user-form-dialog.component.scss']
})
export class UserFormDialogComponent implements OnInit {
  private api = inject(OrgAdminService);
  private fb = inject(FormBuilder);
  private i18n = inject(LocalizationService);

  /** Account being edited; null creates a new one. */
  @Input() user: UserAccount | null = null;
  /** Employee to link (locked) when opened from an employee row. */
  @Input() employee: DialogEmployee | null = null;
  @Input() set branchTree(tree: OrgBranch[]) { this._branches.set(flatten(tree)); }
  /** Only a super administrator may grant the Admin role or create an account without an employee. */
  @Input() isSuperAdmin = false;
  @Output() saved = new EventEmitter<UserAccount>();
  @Output() closed = new EventEmitter<void>();

  private _branches = signal<OrgBranch[]>([]);
  public selectableBranches = computed(() => this._branches().filter(b => b.orgUnitType !== OrgUnitType.Group));
  public employees = signal<Employee[]>([]);
  public saving = signal(false);

  public form: FormGroup = this.fb.group({
    userName: ['', [Validators.required, Validators.maxLength(100)]],
    displayName: ['', [Validators.required, Validators.maxLength(255)]],
    password: [''],
    role: ['None', [Validators.required]],
    employeeId: [null as number | null],
    isActive: [true]
  });
  /** One checkbox `b_<branchId>` per selectable branch (legacy branch grants of the account). */
  public branchForm: FormGroup = this.fb.group({});

  public get isEdit(): boolean { return this.user !== null; }

  public roleOptions = computed<SelectOption[]>(() => ['None', 'Viewer', 'Operator', ...(this.isSuperAdmin ? ['Admin'] : [])]
    .map(role => ({ value: role, label: this.i18n.translate('acc.role.' + role) })));

  public employeeOptions = computed<SelectOption[]>(() => this.employees().map(e => ({ value: e.id, label: `${e.code} - ${e.fullName}` })));

  ngOnInit(): void {
    const u = this.user;
    this.form.reset({
      userName: u?.userName ?? '', displayName: u?.displayName ?? this.employee?.fullName ?? '', password: '',
      role: u?.role ?? 'None', employeeId: u?.employeeId ?? this.employee?.id ?? null, isActive: u?.isActive ?? true
    });
    if (u) this.form.controls['userName'].disable();
    if (this.employee) this.form.controls['employeeId'].disable();
    // Password: required with 12+ characters on create, optional on edit but never shorter than 12.
    this.form.controls['password'].setValidators(u ? [Validators.minLength(12), Validators.maxLength(256)] : [Validators.required, Validators.minLength(12), Validators.maxLength(256)]);
    this.form.controls['password'].updateValueAndValidity();
    for (const branch of this.selectableBranches()) this.branchForm.addControl('b_' + branch.id, new FormControl(!!u?.branchIds.includes(branch.id)));
    this.loadEmployees();
  }

  /** Employees without an account, plus the one currently linked when editing. */
  private loadEmployees(): void {
    this.api.employees({ withoutAccount: true, pageSize: 200 }).subscribe(page => {
      const list = page.items;
      const linked = this.user?.employeeId;
      if (linked && !list.some(e => e.id === linked)) {
        list.push({ id: linked, code: this.user?.employeeCode ?? '', fullName: this.user?.employeeName ?? '' } as Employee);
      }
      if (this.employee && !list.some(e => e.id === this.employee!.id)) list.push(this.employee as unknown as Employee);
      this.employees.set(list);
    });
  }

  public submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const branchIds = this.selectableBranches().filter(b => this.branchForm.value['b_' + b.id]).map(b => b.id);
    this.saving.set(true);
    const request = this.user
      ? this.api.updateUser(this.user.id, { displayName: v.displayName.trim(), role: v.role, branchIds, isActive: v.isActive, password: v.password || null, employeeId: v.employeeId ?? null })
      : this.api.createUser({ userName: v.userName.trim(), displayName: v.displayName.trim(), password: v.password, role: v.role, branchIds, employeeId: v.employeeId ?? null });
    request.subscribe({
      next: account => { this.saving.set(false); this.saved.emit(account); },
      error: () => this.saving.set(false)
    });
  }

  public close(): void { this.closed.emit(); }
}

function flatten(tree: OrgBranch[]): OrgBranch[] {
  const out: OrgBranch[] = [];
  const walk = (nodes: OrgBranch[]) => nodes.forEach(n => { out.push(n); walk(n.children ?? []); });
  walk(tree);
  return out;
}
