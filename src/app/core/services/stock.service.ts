import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  branchId?: number;
  warehouseId: number;
  supplierId?: number;
  notes?: string;
  items: StockReceiptItemRequest[];
}

const MOCK_WAREHOUSES: WarehouseDto[] = [
  {
    id: 1,
    code: 'KHO-TONG',
    name: 'Kho Tổng Hà Nội',
    address: 'Số 1 Phố Huế, Hoàn Kiếm, Hà Nội',
    isDefault: true
  }
];

const MOCK_BALANCES: StockBalanceDto[] = [
  {
    warehouseId: 1,
    warehouseName: 'Kho Tổng Hà Nội',
    itemId: 1,
    itemCode: 'SP0001',
    itemName: 'Bút bi Thiên Long 0.5mm',
    barcode: '8935001812345',
    uomName: 'Cây',
    quantityOnHand: 250,
    averageCostPrice: 3200,
    totalValue: 800000,
    isLowStock: false
  },
  {
    warehouseId: 1,
    warehouseName: 'Kho Tổng Hà Nội',
    itemId: 2,
    itemCode: 'SP0002',
    itemName: 'Giấy in Double A A4 70gsm',
    barcode: '8936002934567',
    uomName: 'Ram',
    quantityOnHand: 5,
    averageCostPrice: 62000,
    totalValue: 310000,
    isLowStock: true // Low stock alert! (min is 10)
  }
];

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/v1/stock`;

  // Signals
  public warehouses = signal<WarehouseDto[]>([]);
  public balances = signal<StockBalanceDto[]>([]);
  public isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  public loadWarehouses(branchId?: number | null): void {
    const url = branchId ? `${this.apiUrl}/warehouses?branchId=${branchId}` : `${this.apiUrl}/warehouses`;
    this.http.get<{ success: boolean; data: WarehouseDto[] }>(url)
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
    this.isLoading.set(true);
    const params: string[] = [];
    if (warehouseId) params.push(`warehouseId=${warehouseId}`);
    if (branchId) params.push(`branchId=${branchId}`);
    const queryString = params.length > 0 ? `?${params.join('&')}` : '';

    this.http.get<{ success: boolean; data: StockBalanceDto[] }>(`${this.apiUrl}/balances${queryString}`)
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
        map(res => res.data),
        tap(() => this.loadBalances(request.warehouseId))
      );
  }
}
