import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, tap } from 'rxjs';

export interface Account { id: number; userName: string; displayName: string; role: 'Admin' | 'Operator' | 'Viewer'; branchIds: number[]; }
@Injectable({ providedIn: 'root' })
export class AuthService {
  public token = signal<string | null>(sessionStorage.getItem('erpm_access_token'));
  public account = signal<Account | null>(null);
  public isAuthenticated = computed(() => !!this.token());
  public canWrite = computed(() => this.account()?.role === 'Admin' || this.account()?.role === 'Operator');
  constructor(private http: HttpClient) {}
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
