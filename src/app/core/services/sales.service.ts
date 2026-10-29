import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map, tap } from 'rxjs';

export enum PaymentMethod {
  Cash = 1,
  BankTransfer = 2,
  Credit = 3
}

export interface SalesInvoiceItemRequest {
  itemId: number;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
}

export interface CreateSalesInvoiceRequest {
  branchId?: number;
  customerId?: number;
  customerName?: string;
  warehouseId: number;
  paymentMethod: PaymentMethod;
  discountAmount?: number;
  paidAmount?: number;
  notes?: string;
  items: SalesInvoiceItemRequest[];
}

export interface SalesInvoiceItemDto {
  itemId: number;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface SalesInvoiceDto {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  branchId?: number;
  branchCode?: string;
  branchName?: string;
  customerName: string;
  paymentMethodName: string;
  subTotal: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingDebt: number;
  items: SalesInvoiceItemDto[];
}

const MOCK_INVOICES: SalesInvoiceDto[] = [
  {
    id: 1,
    invoiceNumber: 'HD-20261011-0001',
    invoiceDate: new Date().toISOString(),
    customerName: 'Khách lẻ',
    paymentMethodName: 'Tiền mặt',
    subTotal: 156000,
    discountAmount: 0,
    totalAmount: 156000,
    paidAmount: 156000,
    remainingDebt: 0,
    items: [
      {
        itemId: 2,
        itemCode: 'SP0002',
        itemName: 'Giấy in Double A A4 70gsm',
        quantity: 2,
        unitPrice: 78000,
        amount: 156000
      }
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private readonly apiUrl = 'http://localhost:5000/api/v1/sales';

  public invoices = signal<SalesInvoiceDto[]>([]);
  public isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  public loadInvoices(branchId?: number | null): void {
    this.isLoading.set(true);
    const url = branchId ? `${this.apiUrl}/invoices?branchId=${branchId}` : `${this.apiUrl}/invoices`;
    this.http.get<{ success: boolean; data: SalesInvoiceDto[] }>(url)
      .subscribe({
        next: (res) => {
          if (res && res.success && res.data) {
            this.invoices.set(res.data);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Lỗi khi tải hóa đơn:', err);
          this.isLoading.set(false);
        }
      });
  }

  public checkout(request: CreateSalesInvoiceRequest): Observable<SalesInvoiceDto> {
    return this.http.post<{ success: boolean; data: SalesInvoiceDto }>(`${this.apiUrl}/pos-checkout`, request)
      .pipe(
        map(res => res.data),
        tap(created => {
          this.invoices.set([created, ...this.invoices()]);
        })
      );
  }
}
