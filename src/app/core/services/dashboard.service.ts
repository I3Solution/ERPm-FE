import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TopSellingItemDto {
  itemCode: string;
  itemName: string;
  quantitySold: number;
  revenue: number;
}

export interface DashboardMetricsDto {
  todaySales: number;
  todayInvoiceCount: number;
  totalItems: number;
  lowStockCount: number;
  totalJournalEntries: number;
  totalInventoryValue: number;
  totalCustomerDebt: number;
  topSellingItems: TopSellingItemDto[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/v1/dashboard/metrics`;

  public metrics = signal<DashboardMetricsDto>({ todaySales: 0, todayInvoiceCount: 0, totalItems: 0, lowStockCount: 0, totalJournalEntries: 0, totalInventoryValue: 0, totalCustomerDebt: 0, topSellingItems: [] });
  public error = signal(false);
  private request?: Subscription;
  public isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  public loadMetrics(branchId?: number | null): void {
    this.request?.unsubscribe();
    this.error.set(false);
    this.isLoading.set(true);
    const url = branchId ? `${this.apiUrl}?branchId=${branchId}` : this.apiUrl;
    this.request = this.http.get<{ success: boolean; data: DashboardMetricsDto }>(url)
      .subscribe({ next: res => {
        if (res && res.success && res.data) {
          this.metrics.set(res.data);
        }
        this.isLoading.set(false);
      }, error: () => { this.error.set(true); this.isLoading.set(false); } });
  }
}
