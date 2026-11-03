import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../../core/services/auth.service';
import { LocalizationService } from '../../../../../core/services/localization.service';
import { OrgAdminService } from '../../../../../core/services/org-admin.service';
import { EffectivePermission, PolicyDocument, Role, UserAccessPolicy, UserAccount } from '../../../../../core/models/org.models';
import { SelectOption } from '../../../../../shared/components/custom-select/custom-select.component';
import { FormControlComponent } from '../../../../../shared/components/form-control/form-control.component';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { EffectivePermissionPreviewComponent } from '../effective-permission-preview/effective-permission-preview.component';
import { UserRoleAssignmentComponent } from '../user-role-assignment/user-role-assignment.component';

/**
 * Accounts tab of the role designer: pick an account, give it extra roles and an inline policy, and preview what it
 * may actually do. Owns the account state and the calls; the two panels are presentational.
 */
@Component({
  selector: 'app-account-access',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, FormControlComponent, UserRoleAssignmentComponent, EffectivePermissionPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-access.component.html',
  styleUrls: ['./account-access.component.scss']
})
export class AccountAccessComponent implements OnInit {
  public auth = inject(AuthService);
  private api = inject(OrgAdminService);
  private i18n = inject(LocalizationService);

  /** Every role of the company, offered as an extra role. */
  public roles = input.required<Role[]>();

  public users = signal<UserAccount[]>([]);
  public saving = signal(false);
  public accountControl = new FormControl<number | null>(null);
  public accountId = signal<number | null>(null);
  public access = signal<UserAccessPolicy | null>(null);
  public effective = signal<EffectivePermission[]>([]);
  public inlineControl = new FormControl('', { nonNullable: true });
  public inlineError = signal<string | null>(null);
  public effectiveFilter = signal<'all' | 'Allowed' | 'Denied'>('all');

  public accountOptions = computed<SelectOption[]>(() => this.users().map(u => ({ value: u.id, label: `${u.userName} - ${u.displayName}` })));

  constructor() {
    this.accountControl.valueChanges.subscribe(id => this.selectAccount(id));
  }

  ngOnInit(): void {
    if (this.auth.can('sys:user:view')) this.api.users().subscribe(users => this.users.set(users));
  }

  private selectAccount(id: number | null): void {
    this.accountId.set(id);
    this.access.set(null);
    this.effective.set([]);
    this.inlineError.set(null);
    if (id == null) return;
    this.api.userAccess(id).subscribe(access => {
      this.access.set(access);
      this.inlineControl.setValue(access.inlinePolicy ? JSON.stringify(access.inlinePolicy, null, 2) : '');
    });
    this.loadEffective(id);
  }

  private loadEffective(id: number): void { this.api.userEffective(id).subscribe(rows => this.effective.set(rows)); }

  public hasExtraRole(roleId: number): boolean { return !!this.access()?.roles.some(r => r.roleId === roleId); }

  public toggleExtraRole(roleId: number): void {
    const access = this.access();
    if (!access || !this.auth.can('sys:role:edit')) return;
    const roles = this.hasExtraRole(roleId) ? access.roles.filter(r => r.roleId !== roleId) : [...access.roles, { roleId }];
    this.access.set({ ...access, roles });
  }

  public saveAccess(): void {
    const access = this.access();
    const id = this.accountId();
    if (!access || id == null || this.saving()) return;
    let inlinePolicy: PolicyDocument | null = null;
    const text = this.inlineControl.value.trim();
    if (text) {
      try {
        inlinePolicy = JSON.parse(text) as PolicyDocument;
        if (!Array.isArray(inlinePolicy.statements)) throw new Error('statements');
      } catch {
        this.inlineError.set(this.i18n.translate('role.json.invalid'));
        return;
      }
    }
    this.inlineError.set(null);
    this.saving.set(true);
    this.api.setUserAccess(id, { ...access, userId: id, inlinePolicy }).subscribe({
      next: saved => { this.saving.set(false); this.access.set(saved); this.loadEffective(id); },
      error: () => this.saving.set(false)
    });
  }
}
