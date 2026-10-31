import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, tap } from 'rxjs';

/** Data range of the signed-in account, as resolved by the IAM engine (union of all Allow scopes). */
export interface ReadScope { unrestricted: boolean; branchIds: number[]; departmentIds: number[]; ownRecords: boolean; }

/** Response of GET /api/v1/auth/me. `permissions` is the expanded list of every granted `module:resource:verb` action. */
export interface Account {
  id: number; userName: string; displayName: string;
  role: 'Admin' | 'Operator' | 'Viewer' | 'None';
  branchIds: number[];
  isSuperAdmin: boolean;
  employeeId: number | null; companyId: number | null; primaryBranchId: number | null;
  departmentId: number | null; jobPositionId: number | null;
  permissions: string[];
  readScope: ReadScope;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  public token = signal<string | null>(sessionStorage.getItem('erpm_access_token'));
  public account = signal<Account | null>(null);
  public isAuthenticated = computed(() => !!this.token());
  public permissions = computed(() => new Set(this.account()?.permissions ?? []));
  public readScope = computed<ReadScope | null>(() => this.account()?.readScope ?? null);

  constructor(private http: HttpClient) {}

  /**
   * True when the account holds the action. Super administrators hold everything; other accounts need an exact
   * entry in `permissions` (the server already expands wildcards). Reads signals, so templates stay reactive.
   */
  can(action: string): boolean {
    const account = this.account();
    return !!account && (account.isSuperAdmin || this.permissions().has(action));
  }

  /** True when the account holds at least one of the actions. */
  canAny(actions: readonly string[]): boolean {
    return actions.some(action => this.can(action));
  }

  login(userName: string, password: string): Observable<Account> {
    return this.http.post<{ accessToken: string }>('/api/v1/auth/login', { userName, password }).pipe(
      tap(result => { this.token.set(result.accessToken); sessionStorage.setItem('erpm_access_token', result.accessToken); }),
      switchMap(() => this.loadAccount())
    );
  }
  loadAccount(): Observable<Account> {
    return this.http.get<{ data: Account }>('/api/v1/auth/me').pipe(
      switchMap(response => { this.account.set(response.data); return [response.data]; })
    );
  }
  logout(): void {
    this.token.set(null); this.account.set(null); sessionStorage.removeItem('erpm_access_token');
  }
}
