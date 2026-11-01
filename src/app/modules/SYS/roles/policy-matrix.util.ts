import { PermissionCatalogItem, PolicyDocument, PolicyStatement } from '../../../core/models/org.models';

export type DataScope = NonNullable<PolicyStatement['dataScope']>;

/** Scope modes a role statement can use (SELF .. GROUP, plus CUSTOM_BRANCHES for a fixed list of branches). */
export const SCOPE_MODES = ['SELF', 'DEPARTMENT', 'DEPARTMENT_TREE', 'BRANCH', 'BRANCH_TREE', 'CUSTOM_BRANCHES', 'COMPANY', 'GROUP'] as const;

/**
 * The simple shape the matrix can edit: one set of allowed actions that share a single data range, plus a set of
 * explicitly denied actions. Anything richer (several ranges, resources, wildcards) stays editable as JSON only.
 */
export interface MatrixModel {
  allow: Set<string>;
  deny: Set<string>;
  /** Null keeps the job position's default range. */
  scope: DataScope | null;
}

export interface MatrixConversion { editable: boolean; model: MatrixModel; }

export const EMPTY_POLICY: PolicyDocument = { version: '1', statements: [] };

const sameScope = (a: DataScope | null | undefined, b: DataScope | null | undefined): boolean =>
  JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));

function normalize(scope: DataScope | null | undefined): unknown {
  if (!scope) return null;
  return {
    mode: scope.mode.toUpperCase(), includeDescendants: !!scope.includeDescendants,
    customBranchIds: [...(scope.customBranchIds ?? [])].sort((x, y) => x - y),
    customDepartmentIds: [...(scope.customDepartmentIds ?? [])].sort((x, y) => x - y)
  };
}

/** Reads a policy into the matrix model; `editable` is false when the policy cannot be shown without losing meaning. */
export function toMatrix(policy: PolicyDocument, catalog: PermissionCatalogItem[]): MatrixConversion {
  const known = new Set(catalog.map(item => item.action));
  const model: MatrixModel = { allow: new Set(), deny: new Set(), scope: null };
  let scopeSeen = false;
  for (const statement of policy.statements) {
    // The server stores an unrestricted statement as resources ["*"], so empty and ["*"] both count as plain.
    const plainResources = (statement.resources ?? []).every(resource => resource === '*');
    const simple = plainResources && statement.actions.every(action => known.has(action));
    if (!simple) return { editable: false, model };
    if (statement.effect === 'Deny') {
      if (statement.dataScope) return { editable: false, model };
      statement.actions.forEach(action => model.deny.add(action));
      continue;
    }
    if (scopeSeen && !sameScope(model.scope, statement.dataScope)) return { editable: false, model };
    model.scope = statement.dataScope ?? null;
    scopeSeen = true;
    statement.actions.forEach(action => model.allow.add(action));
  }
  return { editable: true, model };
}

/** Builds the policy document stored by the server from the matrix model (empty sets produce no statement). */
export function fromMatrix(model: MatrixModel, catalog: PermissionCatalogItem[]): PolicyDocument {
  const order = new Map(catalog.map((item, index) => [item.action, index]));
  const sorted = (set: Set<string>) => [...set].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
  const statements: PolicyStatement[] = [];
  if (model.allow.size > 0) {
    const allow: PolicyStatement = { sid: 'Allow', effect: 'Allow', actions: sorted(model.allow) };
    if (model.scope) allow.dataScope = model.scope;
    statements.push(allow);
  }
  if (model.deny.size > 0) statements.push({ sid: 'Deny', effect: 'Deny', actions: sorted(model.deny) });
  return { version: '1', statements };
}

/** Catalog grouped as module > resource > verbs, in catalog order. */
export interface ResourceGroup { resource: string; items: PermissionCatalogItem[]; }
export interface ModuleGroup { module: string; resources: ResourceGroup[]; count: number; }

export function groupCatalog(catalog: PermissionCatalogItem[]): ModuleGroup[] {
  const modules = new Map<string, Map<string, PermissionCatalogItem[]>>();
  for (const item of catalog) {
    const resources = modules.get(item.module) ?? new Map<string, PermissionCatalogItem[]>();
    resources.set(item.resource, [...(resources.get(item.resource) ?? []), item]);
    modules.set(item.module, resources);
  }
  return [...modules].map(([module, resources]) => ({
    module,
    resources: [...resources].map(([resource, items]) => ({ resource, items })),
    count: [...resources.values()].reduce((sum, items) => sum + items.length, 0)
  }));
}
