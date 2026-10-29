import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export enum PartnerType {
  Customer = 1,
  Vendor = 2,
  Both = 3
}

export interface PartnerDto {
  id: number;
  code: string;
  name: string;
  partnerType: PartnerType;
  phone?: string;
  email?: string;
  address?: string;
  taxCode?: string;
  creditLimit: number;
  debtBalance: number;
  isActive: boolean;
}

export interface CreatePartnerRequest {
  code: string;
  name: string;
  partnerType: PartnerType;
  phone?: string;
  email?: string;
  address?: string;
  taxCode?: string;
  creditLimit: number;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PartnerService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/v1/partners`;

  public partners = signal<PartnerDto[]>([]);
  public isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  public loadPartners(): void {
    this.isLoading.set(true);
    this.http.get<{ success: boolean; data: PartnerDto[] }>(this.apiUrl)
      .subscribe({
        next: (res) => {
          if (res && res.success && res.data) {
            this.partners.set(res.data);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Lỗi khi tải danh sách đối tác:', err);
          this.isLoading.set(false);
        }
      });
  }

  public createPartner(request: CreatePartnerRequest): Observable<PartnerDto> {
    return this.http.post<{ success: boolean; data: PartnerDto }>(this.apiUrl, request)
      .pipe(
        map(res => res.data),
        tap(created => {
          this.partners.set([created, ...this.partners()]);
        })
      );
  }
}
