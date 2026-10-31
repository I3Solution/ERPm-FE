/** Wire models of the organization, HRM and IAM administration APIs (camelCase JSON of the BE DTOs). */

export interface PagedResult<T> { items: T[]; totalCount: number; pageIndex: number; pageSize: number; totalPages?: number; }

/** Standard list filter of every BaseCrud endpoint. */
export interface ListFilter { pageIndex?: number; pageSize?: number; keyword?: string; isActive?: boolean; sortBy?: string; isAscending?: boolean; }

export enum OrgUnitType { Group = 0, Company = 1, Branch = 2 }

export interface OrgBranch {
  id: number; code: string; name: string; parentId: number | null; parentName?: string | null;
  orgUnitType: OrgUnitType; companyId: number | null; taxCode?: string | null;
  address?: string | null; phone?: string | null; email?: string | null;
  isDefault: boolean; isActive: boolean; children: OrgBranch[];
}
export interface SaveBranchRequest {
  code: string; name: string; parentId: number | null; taxCode?: string | null;
  address?: string | null; phone?: string | null; email?: string | null; isActive?: boolean;
}
/** Create adds the node type, which can never be changed afterwards. */
export interface CreateBranchRequest extends SaveBranchRequest { orgUnitType: OrgUnitType; }

export interface DepartmentLevel {
  id: number; code: string; name: string; translations: Record<string, string>;
  sortOrder: number; companyId: number | null; standardLevelCode?: string | null; isActive: boolean;
}

export interface Department {
  id: number; code: string; name: string; translations: Record<string, string>;
  companyId: number; branchId: number; parentId: number | null; levelId: number; path: string; depth: number; isActive: boolean;
}
export interface SaveDepartmentRequest {
  code: string; name: string; translations?: Record<string, string>;
  companyId: number; branchId: number; parentId: number | null; levelId: number | null; isActive: boolean;
}
export interface DepartmentFilter extends ListFilter { levelCode?: string; underId?: number; }

export interface JobPosition {
  id: number; code: string; name: string; translations: Record<string, string>;
  companyId: number | null; departmentId: number | null; rankOrder: number; defaultScopeMode: string; isActive: boolean;
}
export interface SaveJobPositionRequest {
  code: string; name: string; translations?: Record<string, string>;
  companyId: number | null; departmentId: number | null; rankOrder: number; defaultScopeMode: string; isActive: boolean;
}

export interface Employee {
  id: number; code: string; fullName: string; email?: string | null; phone?: string | null; hireDate?: string | null;
  companyId: number; branchId: number; departmentId: number | null; jobPositionId: number; userId: number | null; isActive: boolean;
}
/** Creating an employee also records the hire work-history row from the org fields. */
export interface CreateEmployeeRequest {
  code: string; fullName: string; email?: string | null; phone?: string | null; hireDate?: string | null;
  companyId: number; branchId: number; departmentId: number | null; jobPositionId: number; userId?: number | null;
}
export interface UpdateEmployeeRequest {
  code: string; fullName: string; email?: string | null; phone?: string | null; hireDate?: string | null; userId?: number | null;
}
export interface EmployeeFilter extends ListFilter { withoutAccount?: boolean; }

export interface PolicyStatement {
  sid?: string; effect: 'Allow' | 'Deny'; actions: string[]; resources?: string[];
  dataScope?: { mode: string; includeDescendants?: boolean; customBranchIds?: number[]; customDepartmentIds?: number[] } | null;
}
export interface PolicyDocument { version: string; statements: PolicyStatement[]; }

export interface Role {
  id: number; code: string; name: string; description?: string | null; translations: Record<string, string>;
  companyId: number | null; isSystemRole: boolean; policyDocument: PolicyDocument; isActive: boolean;
}
export interface DepartmentRoleGrant { roleId: number; applyToChildren: boolean; }

export interface UserAccount {
  id: number; userName: string; displayName: string; role: string; branchIds: number[];
  employeeId?: number | null; employeeCode?: string | null; employeeName?: string | null;
}
export interface CreateUserRequest {
  userName: string; displayName: string; password: string; role: string; branchIds: number[]; employeeId?: number | null;
}
export interface UpdateUserRequest {
  displayName: string; role: string; branchIds: number[]; isActive: boolean; password?: string | null; employeeId?: number | null;
}

export interface PermissionCatalogItem { action: string; module: string; resource: string; verb: string; }

/** Job position default scope modes accepted by the BE (CUSTOM_BRANCHES is only valid inside policies). */
export const POSITION_SCOPE_MODES = ['SELF', 'DEPARTMENT', 'DEPARTMENT_TREE', 'BRANCH', 'BRANCH_TREE', 'COMPANY', 'GROUP'] as const;
