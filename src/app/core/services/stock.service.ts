import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, catchError, of, map, tap } from 'rxjs';

export interface WarehouseDto {
  id: number;
  branchId?: number;
  branchName?: string;
  code: string;
  name: string;
  translations?: Record<string, string>;
  address?: string;
  isDefault: boolean;
}

export interface StockBalanceDto {
  warehouseId: number;
  warehouseName: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  barcode?: string;
  uomName?: string;
  quantityOnHand: number;
  averageCostPrice: number;
  totalValue: number;
  isLowStock: boolean;
}

export interface StockReceiptItemRequest {
  itemId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreateStockReceiptRequest {
  requestId: string;
  branchId?: number;
  warehouseId: number;
  supplierId?: number;
  notes?: string;
  items: StockReceiptItemRequest[];
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private readonly apiUrl = '/api/v1/stock';

  // Signals
  public warehouses = signal<WarehouseDto[]>([]);
  public balances = signal<StockBalanceDto[]>([]);
  public isLoading = signal<boolean>(false);

  private warehousesRequest?: Subscription;
  private balancesRequest?: Subscription;
  constructor(private http: HttpClient) {}

  public loadWarehouses(branchId?: number | null): void {
    this.warehousesRequest?.unsubscribe();
    const url = branchId ? `${this.apiUrl}/warehouses?branchId=${branchId}` : `${this.apiUrl}/warehouses`;
    this.warehousesRequest = this.http.get<{ success: boolean; data: WarehouseDto[] }>(url)
      .subscribe({
        next: (res) => {
          if (res && res.success && res.data) {
            this.warehouses.set(res.data);
          }
        },
        error: (err) => console.error('Failed to load warehouses:', err)
      });
  }

  public loadBalances(warehouseId?: number | null, branchId?: number | null): void {
    this.balancesRequest?.unsubscribe();
    this.isLoading.set(true);
    const params: string[] = [];
    if (warehouseId) params.push(`warehouseId=${warehouseId}`);
    if (branchId) params.push(`branchId=${branchId}`);
    const queryString = params.length > 0 ? `?${params.join('&')}` : '';

    this.balancesRequest = this.http.get<{ success: boolean; data: StockBalanceDto[] }>(`${this.apiUrl}/balances${queryString}`)
      .subscribe({
        next: (res) => {
          if (res && res.success && res.data) {
            this.balances.set(res.data);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Lỗi khi tải tồn kho:', err);
          this.isLoading.set(false);
        }
      });
  }

  public createStockReceipt(request: CreateStockReceiptRequest): Observable<boolean> {
    return this.http.post<{ success: boolean; data: boolean }>(`${this.apiUrl}/receipts`, request)
      .pipe(
        map(res => res.data)
      );
  }
}
