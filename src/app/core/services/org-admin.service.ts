import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateBranchRequest, CreateEmployeeRequest, CreateUserRequest, Department, DepartmentFilter, DepartmentLevel, DepartmentRoleGrant,
  Employee, EmployeeFilter, JobPosition, ListFilter, OrgBranch, PagedResult, PermissionCatalogItem, Role, SaveBranchRequest,
  SaveDepartmentRequest, SaveJobPositionRequest, UpdateEmployeeRequest, UpdateUserRequest, UserAccount
} from '../models/org.models';

interface ApiEnvelope<T> { success: boolean; data: T; message?: string; }

/**
 * Typed client of the organization, HRM and IAM administration endpoints. Stateless: screens keep their own
 * signals, so several screens can use it at once without sharing list state.
 */
@Injectable({ providedIn: 'root' })
export class OrgAdminService {
  private readonly api = `${environment.apiBaseUrl}/api/v1`;

  constructor(private http: HttpClient) {}

  // Branches (group / company / branch tree)
  branchTree(): Observable<OrgBranch[]> { return this.get<OrgBranch[]>('/branches/tree'); }
  branches(): Observable<OrgBranch[]> { return this.get<OrgBranch[]>('/branches'); }
  createBranch(request: CreateBranchRequest): Observable<OrgBranch> { return this.post<OrgBranch>('/branches', request); }
  updateBranch(id: number, request: SaveBranchRequest): Observable<OrgBranch> { return this.put<OrgBranch>(`/branches/${id}`, request); }
  deleteBranch(id: number): Observable<boolean> { return this.delete(`/branches/${id}`); }

  // Department levels and departments
  departmentLevels(filter: ListFilter = { pageSize: 100 }): Observable<PagedResult<DepartmentLevel>> { return this.get('/hrm/department-levels', filter); }
  departments(filter: DepartmentFilter = { pageSize: 500 }): Observable<PagedResult<Department>> { return this.get('/hrm/departments', filter); }
  createDepartment(request: SaveDepartmentRequest): Observable<Department> { return this.post('/hrm/departments', request); }
  updateDepartment(id: number, request: SaveDepartmentRequest): Observable<Department> { return this.put(`/hrm/departments/${id}`, request); }
  deleteDepartment(id: number): Observable<boolean> { return this.delete(`/hrm/departments/${id}`); }

  // Job positions and their default roles
  jobPositions(filter: ListFilter = { pageSize: 200 }): Observable<PagedResult<JobPosition>> { return this.get('/hrm/job-positions', filter); }
  createJobPosition(request: SaveJobPositionRequest): Observable<JobPosition> { return this.post('/hrm/job-positions', request); }
  updateJobPosition(id: number, request: SaveJobPositionRequest): Observable<JobPosition> { return this.put(`/hrm/job-positions/${id}`, request); }
  deleteJobPosition(id: number): Observable<boolean> { return this.delete(`/hrm/job-positions/${id}`); }
  jobPositionRoles(id: number): Observable<number[]> { return this.get(`/sys/roles/job-positions/${id}`); }
  setJobPositionRoles(id: number, roleIds: number[]): Observable<number[]> { return this.put(`/sys/roles/job-positions/${id}`, { roleIds }); }

  // Employees
  employees(filter: EmployeeFilter = { pageSize: 50 }): Observable<PagedResult<Employee>> { return this.get('/hrm/employees', filter); }
  createEmployee(request: CreateEmployeeRequest): Observable<Employee> { return this.post('/hrm/employees', request); }
  updateEmployee(id: number, request: UpdateEmployeeRequest): Observable<Employee> { return this.put(`/hrm/employees/${id}`, request); }
  deleteEmployee(id: number): Observable<boolean> { return this.delete(`/hrm/employees/${id}`); }

  // Roles
  roles(): Observable<Role[]> { return this.get('/sys/roles'); }
  departmentRoles(departmentId: number): Observable<DepartmentRoleGrant[]> { return this.get(`/sys/roles/departments/${departmentId}`); }
  setDepartmentRoles(departmentId: number, grants: DepartmentRoleGrant[]): Observable<DepartmentRoleGrant[]> { return this.put(`/sys/roles/departments/${departmentId}`, grants); }
  permissionCatalog(): Observable<PermissionCatalogItem[]> { return this.get('/sys/permissions/catalog'); }

  // Accounts
  users(): Observable<UserAccount[]> { return this.get('/auth/users'); }
  createUser(request: CreateUserRequest): Observable<UserAccount> { return this.post('/auth/users', request); }
  updateUser(id: number, request: UpdateUserRequest): Observable<UserAccount> { return this.put(`/auth/users/${id}`, request); }

  private get<T>(path: string, filter?: object): Observable<T> {
    return this.http.get<ApiEnvelope<T>>(this.api + path, { params: toParams(filter) }).pipe(map(res => res.data));
  }
  private post<T>(path: string, body: unknown): Observable<T> { return this.http.post<ApiEnvelope<T>>(this.api + path, body).pipe(map(res => res.data)); }
  private put<T>(path: string, body: unknown): Observable<T> { return this.http.put<ApiEnvelope<T>>(this.api + path, body).pipe(map(res => res.data)); }
  private delete(path: string): Observable<boolean> { return this.http.delete<ApiEnvelope<boolean>>(this.api + path).pipe(map(res => res.data)); }
}

/** Query string from a filter object; undefined and empty values are dropped. */
function toParams(filter?: object): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(filter ?? {})) {
    if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
  }
  return params;
}
