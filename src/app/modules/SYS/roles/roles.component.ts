import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { LocalizationService } from '../../../core/services/localization.service';
import { OrgAdminService } from '../../../core/services/org-admin.service';
import {
  EffectivePermission, OrgBranch, PermissionCatalogItem, PolicyDocument, Role, SaveRoleRequest, UserAccessPolicy, UserAccount
} from '../../../core/models/org.models';
import { BranchSelectComponent } from '../../../shared/components/branch-select/branch-select.component';
import { SelectOption } from '../../../shared/components/custom-select/custom-select.component';
import { FormControlComponent } from '../../../shared/components/form-control/form-control.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { EMPTY_POLICY, MatrixModel, SCOPE_MODES, DataScope, fromMatrix, groupCatalog, toMatrix } from './policy-matrix.util';

type DesignerMode = 'matrix' | 'json';
type PageTab = 'roles' | 'accounts';

/**
 * Role designer (IAM). Left: the roles of the caller's company plus the group templates. Right: one role edited
 * either as a module-grouped permission matrix ("what can be done") with a separate data range ("whose data is
 * visible"), or as raw policy JSON for rules the matrix cannot express. The Accounts tab assigns extra roles and an
 * inline policy to one account and previews what that account may actually do, with the role or statement that
 * grants or denies each action.
 */
@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, FormControlComponent, BranchSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit {
  public auth = inject(AuthService);
  private api = inject(OrgAdminService);
  private i18n = inject(LocalizationService);

  public tab = signal<PageTab>('roles');
  public roles = signal<Role[]>([]);
  public catalog = signal<PermissionCatalogItem[]>([]);
  public branchTree = signal<OrgBranch[]>([]);
  public users = signal<UserAccount[]>([]);
  public loading = signal(false);
  public saving = signal(false);

  // Role designer state
  public selectedId = signal<number | null>(null);
  /** The unsaved role currently edited; `id` 0 means a new role (create or copy). */
  public draft = signal<Role | null>(null);
  public mode = signal<DesignerMode>('matrix');
  public matrix = signal<MatrixModel>({ allow: new Set(), deny: new Set(), scope: null });
  public matrixEditable = signal(true);
  public jsonError = signal<string | null>(null);
  public collapsed = signal<ReadonlySet<string>>(new Set());
  public keyword = signal('');
  public keywordControl = new FormControl('');

  public form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(50)] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
    description: new FormControl('', { nonNullable: true }),
    isActive: new FormControl(true, { nonNullable: true }),
    scopeMode: new FormControl('', { nonNullable: true }),
    includeDescendants: new FormControl(false, { nonNullable: true }),
    json: new FormControl('', { nonNullable: true })
  });

  // Accounts tab state
  public accountControl = new FormControl<number | null>(null);
  public accountId = signal<number | null>(null);
  public access = signal<UserAccessPolicy | null>(null);
  public effective = signal<EffectivePermission[]>([]);
  public inlineControl = new FormControl('', { nonNullable: true });
  public inlineError = signal<string | null>(null);
  public effectiveFilter = signal<'all' | 'Allowed' | 'Denied'>('all');

  public canEdit = computed(() => this.auth.can('sys:role:edit') || this.auth.can('sys:role:create'));
  public readOnly = computed(() => !!this.draft()?.isSystemRole || !this.canEdit());
  public modules = computed(() => groupCatalog(this.catalog()));
  public scopeOptions = computed<SelectOption[]>(() => [
    { value: '', label: this.i18n.translate('role.scope.default') },
    ...SCOPE_MODES.map(mode => ({ value: mode, label: this.i18n.translate('jp.scope.' + mode) }))
  ]);
  public accountOptions = computed<SelectOption[]>(() => this.users().map(u => ({ value: u.id, label: `${u.userName} - ${u.displayName}` })));
  public customBranchIds = signal<number[]>([]);
  public showCustomBranches = computed(() => this.scopeModeValue() === 'CUSTOM_BRANCHES');
  private scopeModeValue = signal('');

  public visibleRoles = computed(() => {
    const keyword = this.keyword().trim().toLowerCase();
    return this.roles().filter(r => !keyword || r.code.toLowerCase().includes(keyword) || r.name.toLowerCase().includes(keyword));
  });

  /** Effective rows grouped by module, optionally limited to allowed or denied actions. */
  public effectiveGroups = computed(() => {
    const filter = this.effectiveFilter();
    const rows = this.effective().filter(row => filter === 'all' || row.status === filter);
    const groups = new Map<string, EffectivePermission[]>();
    for (const row of rows) groups.set(row.module, [...(groups.get(row.module) ?? []), row]);
    return [...groups].map(([module, items]) => ({ module, items }));
  });
  public effectiveCounts = computed(() => {
    const rows = this.effective();
    return { allowed: rows.filter(r => r.status === 'Allowed').length, denied: rows.filter(r => r.status === 'Denied').length };
  });

  constructor() {
    this.keywordControl.valueChanges.subscribe(text => this.keyword.set(text ?? ''));
    this.form.controls.scopeMode.valueChanges.subscribe(value => this.scopeModeValue.set(value));
    this.accountControl.valueChanges.subscribe(id => this.selectAccount(id));
  }

  ngOnInit(): void {
    this.reload();
    this.api.permissionCatalog().subscribe(catalog => this.catalog.set(catalog));
    this.api.branchTree().subscribe(tree => this.branchTree.set(tree));
    if (this.auth.can('sys:user:view')) this.api.users().subscribe(users => this.users.set(users));
  }

  public reload(selectId?: number | null): void {
    this.loading.set(true);
    this.api.roles().subscribe({
      next: roles => {
        this.roles.set(roles);
        this.loading.set(false);
        const target = roles.find(r => r.id === (selectId ?? this.selectedId()));
        if (target) this.select(target);
      },
      error: () => this.loading.set(false)
    });
  }

  // ----- Role designer -----

  public select(role: Role): void {
    this.selectedId.set(role.id);
    this.open({ ...role });
  }

  public startNew(): void {
    this.selectedId.set(null);
    this.open({
      id: 0, code: '', name: '', description: '', translations: {}, companyId: this.auth.account()?.companyId ?? null,
      isSystemRole: false, policyDocument: structuredClone(EMPTY_POLICY), isActive: true, version: 0
    });
  }

  /** Copies the role's permissions into a new unsaved role so it can be adjusted before saving. */
  public copy(role: Role): void {
    this.selectedId.set(null);
    this.open({
      ...structuredClone(role), id: 0, code: `${role.code}_COPY`.slice(0, 50), name: `${role.name} (${this.i18n.translate('role.copy_suffix')})`,
      isSystemRole: false, companyId: this.auth.account()?.companyId ?? role.companyId, version: 0
    });
  }

  private open(role: Role): void {
    this.draft.set(role);
    const converted = toMatrix(role.policyDocument, this.catalog());
    this.matrix.set(converted.model);
    this.matrixEditable.set(converted.editable);
    this.mode.set(converted.editable ? 'matrix' : 'json');
    this.jsonError.set(null);
    this.collapsed.set(new Set(this.modules().map(m => m.module)));
    this.customBranchIds.set(converted.model.scope?.customBranchIds ?? []);
    this.form.reset({
      code: role.code, name: role.name, description: role.description ?? '', isActive: role.isActive,
      scopeMode: converted.model.scope?.mode.toUpperCase() ?? '', includeDescendants: !!converted.model.scope?.includeDescendants,
      json: JSON.stringify(role.policyDocument, null, 2)
    });
    // The code of a saved role is its identity, so only a new role can set it.
    if (this.readOnly()) this.form.disable();
    else {
      this.form.enable();
      if (role.id !== 0) this.form.controls.code.disable();
    }
  }

  public toggleModule(module: string): void {
    const next = new Set(this.collapsed());
    next.has(module) ? next.delete(module) : next.add(module);
    this.collapsed.set(next);
  }

  public expandAll(open: boolean): void { this.collapsed.set(open ? new Set() : new Set(this.modules().map(m => m.module))); }

  public isAllowed(action: string): boolean { return this.matrix().allow.has(action); }
  public isDenied(action: string): boolean { return this.matrix().deny.has(action); }

  /** Ticking an action allows it; a denied action is cleared first so one action never sits in both sets. */
  public toggleAllow(action: string): void {
    if (this.readOnly()) return;
    const model = this.matrix();
    const allow = new Set(model.allow);
    const deny = new Set(model.deny);
    allow.has(action) ? allow.delete(action) : (allow.add(action), deny.delete(action));
    this.matrix.set({ ...model, allow, deny });
  }

  public toggleDeny(action: string): void {
    if (this.readOnly()) return;
    const model = this.matrix();
    const allow = new Set(model.allow);
    const deny = new Set(model.deny);
    deny.has(action) ? deny.delete(action) : (deny.add(action), allow.delete(action));
    this.matrix.set({ ...model, allow, deny });
  }

  public allowedCount(module: string): number {
    return this.catalog().filter(i => i.module === module && this.matrix().allow.has(i.action)).length;
  }

  /** Allows or clears every action of a module at once. */
  public setModule(module: string, on: boolean): void {
    if (this.readOnly()) return;
    const model = this.matrix();
    const allow = new Set(model.allow);
    const deny = new Set(model.deny);
    for (const item of this.catalog().filter(i => i.module === module)) {
      if (on) { allow.add(item.action); deny.delete(item.action); } else allow.delete(item.action);
    }
    this.matrix.set({ ...model, allow, deny });
  }

  public setCustomBranch(id: number | null): void {
    if (id == null || this.customBranchIds().includes(id)) return;
    this.customBranchIds.set([...this.customBranchIds(), id]);
  }
  public removeCustomBranch(id: number): void { this.customBranchIds.set(this.customBranchIds().filter(b => b !== id)); }
  public branchName(id: number): string { return this.findBranch(this.branchTree(), id)?.name ?? String(id); }
  private findBranch(nodes: OrgBranch[], id: number): OrgBranch | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = this.findBranch(node.children ?? [], id);
      if (found) return found;
    }
    return null;
  }

  /** Switching to JSON writes the matrix out; switching back parses the JSON and refuses what the matrix cannot show. */
  public switchMode(next: DesignerMode): void {
    if (next === this.mode()) return;
    if (next === 'json') {
      this.form.controls.json.setValue(JSON.stringify(this.currentPolicy(), null, 2));
      this.mode.set('json');
      return;
    }
    const parsed = this.parseJson();
    if (!parsed) return;
    const converted = toMatrix(parsed, this.catalog());
    this.matrixEditable.set(converted.editable);
    if (!converted.editable) { this.jsonError.set(this.i18n.translate('role.json.not_matrix')); return; }
    this.matrix.set(converted.model);
    this.customBranchIds.set(converted.model.scope?.customBranchIds ?? []);
    this.form.patchValue({
      scopeMode: converted.model.scope?.mode.toUpperCase() ?? '', includeDescendants: !!converted.model.scope?.includeDescendants
    });
    this.mode.set('matrix');
  }

  private parseJson(): PolicyDocument | null {
    try {
      const value = JSON.parse(this.form.controls.json.value) as PolicyDocument;
      if (!value || !Array.isArray(value.statements)) throw new Error('statements');
      this.jsonError.set(null);
      return value;
    } catch {
      this.jsonError.set(this.i18n.translate('role.json.invalid'));
      return null;
    }
  }

  private currentScope(): DataScope | null {
    const mode = this.form.controls.scopeMode.value;
    if (!mode) return null;
    const scope: DataScope = { mode };
    if (this.form.controls.includeDescendants.value) scope.includeDescendants = true;
    if (mode === 'CUSTOM_BRANCHES') scope.customBranchIds = this.customBranchIds();
    return scope;
  }

  private currentPolicy(): PolicyDocument {
    return fromMatrix({ ...this.matrix(), scope: this.currentScope() }, this.catalog());
  }

  public save(): void {
    const role = this.draft();
    if (!role || this.readOnly() || this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const policy = this.mode() === 'json' ? this.parseJson() : this.currentPolicy();
    if (!policy) return;
    const value = this.form.getRawValue();
    const request: SaveRoleRequest = {
      code: value.code.trim().toUpperCase(), name: value.name.trim(), description: value.description.trim() || null,
      translations: role.translations, companyId: role.companyId, policyDocument: policy, isActive: value.isActive,
      version: role.id === 0 ? null : role.version
    };
    this.saving.set(true);
    const call = role.id === 0 ? this.api.createRole(request) : this.api.updateRole(role.id, request);
    call.subscribe({
      next: saved => { this.saving.set(false); this.reload(saved.id); },
      error: () => this.saving.set(false)
    });
  }

  public remove(role: Role): void {
    if (role.isSystemRole || !this.auth.can('sys:role:delete')) return;
    if (!window.confirm(this.i18n.translate('role.delete_confirm'))) return;
    this.api.deleteRole(role.id).subscribe(() => {
      if (this.selectedId() === role.id) { this.draft.set(null); this.selectedId.set(null); }
      this.reload();
    });
  }

  public cancelDraft(): void {
    const id = this.selectedId();
    const role = this.roles().find(r => r.id === id);
    role ? this.select(role) : this.draft.set(null);
  }

  // ----- Accounts tab -----

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

  /** Human readable origin of a matched statement, e.g. "Position role: SALES_ACCOUNTANT". */
  public sourceLabel(source: string): string {
    const [kind, code] = source.split(':');
    const label = this.i18n.translate('role.source.' + kind);
    return code ? `${label}: ${code}` : label;
  }
}
