import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { LocalizationService } from '../../../core/services/localization.service';
import { OrgAdminService } from '../../../core/services/org-admin.service';
import { OrgBranch, PermissionCatalogItem, PolicyDocument, Role, SaveRoleRequest } from '../../../core/models/org.models';
import { SelectOption } from '../../../shared/components/custom-select/custom-select.component';
import { FormControlComponent } from '../../../shared/components/form-control/form-control.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AccountAccessComponent } from './components/account-access/account-access.component';
import { DataScopeComponent } from './components/data-scope/data-scope.component';
import { PermissionMatrixComponent } from './components/permission-matrix/permission-matrix.component';
import { PolicyJsonEditorComponent } from './components/policy-json-editor/policy-json-editor.component';
import { EMPTY_POLICY, MatrixModel, SCOPE_MODES, DataScope, fromMatrix, toMatrix } from './policy-matrix.util';

type DesignerMode = 'matrix' | 'json';
type PageTab = 'roles' | 'accounts';

/**
 * Role designer (IAM). Left: the roles of the caller's company plus the group templates. Right: one role edited
 * either as a module-grouped permission matrix ("what can be done") with a separate data range ("whose data is
 * visible"), or as raw policy JSON for rules the matrix cannot express. This component owns the role list, the draft
 * and the save; the matrix, data range, JSON box and the Accounts tab are child components under `components/`.
 */
@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, TranslatePipe, FormControlComponent, PermissionMatrixComponent, DataScopeComponent,
    PolicyJsonEditorComponent, AccountAccessComponent
  ],
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
  public scopeError = signal<string | null>(null);
  /** Set when the server refused a save because someone else changed the role first (409). */
  public conflict = signal(false);
  /** Bumped each time a role is opened so the matrix folds all its modules back. */
  public openCount = signal(0);
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

  public canEdit = computed(() => this.auth.can('sys:role:edit') || this.auth.can('sys:role:create'));
  public readOnly = computed(() => !!this.draft()?.isSystemRole || !this.canEdit());
  public scopeOptions = computed<SelectOption[]>(() => [
    { value: '', label: this.i18n.translate('role.scope.default') },
    ...SCOPE_MODES.map(mode => ({ value: mode, label: this.i18n.translate((mode === 'CUSTOM_BRANCHES' ? 'role.scope.' : 'jp.scope.') + mode) }))
  ]);
  public customBranchIds = signal<number[]>([]);
  public showCustomBranches = computed(() => this.scopeModeValue() === 'CUSTOM_BRANCHES');
  private scopeModeValue = signal('');

  public visibleRoles = computed(() => {
    const keyword = this.keyword().trim().toLowerCase();
    return this.roles().filter(r => !keyword || r.code.toLowerCase().includes(keyword) || r.name.toLowerCase().includes(keyword));
  });

  constructor() {
    this.keywordControl.valueChanges.subscribe(text => this.keyword.set(text ?? ''));
    this.form.controls.scopeMode.valueChanges.subscribe(value => this.scopeModeValue.set(value));
  }

  ngOnInit(): void {
    this.reload();
    this.api.permissionCatalog().subscribe(catalog => this.catalog.set(catalog));
    this.api.branchTree().subscribe(tree => this.branchTree.set(tree));
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
    this.scopeError.set(null);
    this.conflict.set(false);
    this.openCount.update(n => n + 1);
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

  public onMatrixChange(model: MatrixModel): void { this.matrix.set(model); }
  public onCustomBranchesChange(ids: number[]): void { this.customBranchIds.set(ids); }

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
    if (this.mode() === 'matrix' && this.form.controls.scopeMode.value === 'CUSTOM_BRANCHES' && this.customBranchIds().length === 0) {
      this.scopeError.set(this.i18n.translate('role.scope.custom_required'));
      return;
    }
    this.scopeError.set(null);
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
      next: saved => { this.saving.set(false); this.conflict.set(false); this.reload(saved.id); },
      error: (error: { status?: number }) => { this.saving.set(false); this.conflict.set(error?.status === 409); }
    });
  }

  /** Drops the unsaved edits and reopens the latest stored version of the role. */
  public reloadSelected(): void { this.conflict.set(false); this.reload(this.selectedId()); }

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
}
