import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  PagedResult,
  PriceListItemDto,
  PriceListDetailDto,
  CreatePriceListRequest,
  CalculatePriceRequest,
  CalculatePriceResponse,
  SalesQuotationItemDto,
  SalesQuotationDetailDto,
  CreateSalesQuotationRequest,
  SalesOrderItemDto,
  SalesOrderDetailDto,
  CreateSalesOrderRequest,
  SalesReturnItemDto,
  SalesReturnDetailDto,
  CreateSalesReturnRequest,
  RefundMethod
} from '../models/sd.models';

@Injectable({
  providedIn: 'root'
})
export class SdService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/v1/sales`;

  /**
   * Mock Mode flag: defaults to true during Step 22 frontend development phase (Phase 22.1 - 22.5),
   * can be toggled to false when backend endpoints are ready (FE-22.8).
   */
  public useMock = signal<boolean>(true);

  // Reactive state signals
  public priceLists = signal<PriceListDetailDto[]>([]);
  public quotations = signal<SalesQuotationDetailDto[]>([]);
  public orders = signal<SalesOrderDetailDto[]>([]);
  public returns = signal<SalesReturnDetailDto[]>([]);
  public isLoading = signal<boolean>(false);

  // In-memory mock repositories
  private mockPriceLists: PriceListDetailDto[] = [
    {
      id: 1,
      externalId: '018f8e00-0001-7000-8000-000000000001',
      code: 'PL-RETAIL-2026',
      name: 'Bảng giá Bán lẻ Tiêu chuẩn 2026',
      currency: 'VND',
      effectiveFrom: '2026-01-01T00:00:00Z',
      effectiveTo: '2026-12-31T23:59:59Z',
      branchId: undefined,
      branchName: 'Toàn hệ thống',
      isActive: true,
      notes: 'Áp dụng cho toàn bộ khách hàng mua lẻ tại cửa hàng và online.',
      items: [
        { id: 1, itemId: 1, itemCode: 'IP15P-128', itemName: 'iPhone 15 Pro 128GB', unitName: 'Cái', unitPrice: 28500000, minQuantity: 1, discountPercent: 0 },
        { id: 2, itemId: 1, itemCode: 'IP15P-128', itemName: 'iPhone 15 Pro 128GB', unitName: 'Cái', unitPrice: 27900000, minQuantity: 5, discountPercent: 2.1 },
        { id: 3, itemId: 2, itemCode: 'MAC-M3-16', itemName: 'MacBook Air M3 16GB/512GB', unitName: 'Máy', unitPrice: 32990000, minQuantity: 1, discountPercent: 0 },
        { id: 4, itemId: 3, itemCode: 'AIRP-PRO2', itemName: 'AirPods Pro 2 USB-C', unitName: 'Hộp', unitPrice: 5990000, minQuantity: 1, discountPercent: 0 }
      ]
    },
    {
      id: 2,
      externalId: '018f8e00-0002-7000-8000-000000000002',
      code: 'PL-WHOLESALE-VIP',
      name: 'Bảng giá Đại lý Cấp 1 & Đối tác B2B',
      currency: 'VND',
      effectiveFrom: '2026-01-01T00:00:00Z',
      branchId: 1,
      branchName: 'Chi nhánh Miền Bắc',
      isActive: true,
      notes: 'Bảng giá ưu đãi chiết khấu theo bậc thang số lượng cho các đại lý ủy quyền.',
      items: [
        { id: 5, itemId: 1, itemCode: 'IP15P-128', itemName: 'iPhone 15 Pro 128GB', unitName: 'Cái', unitPrice: 26000000, minQuantity: 10, discountPercent: 5 },
        { id: 6, itemId: 1, itemCode: 'IP15P-128', itemName: 'iPhone 15 Pro 128GB', unitName: 'Cái', unitPrice: 25200000, minQuantity: 30, discountPercent: 8 },
        { id: 7, itemId: 1, itemCode: 'IP15P-128', itemName: 'iPhone 15 Pro 128GB', unitName: 'Cái', unitPrice: 24500000, minQuantity: 50, discountPercent: 10 },
        { id: 8, itemId: 2, itemCode: 'MAC-M3-16', itemName: 'MacBook Air M3 16GB/512GB', unitName: 'Máy', unitPrice: 30500000, minQuantity: 5, discountPercent: 7.5 },
        { id: 9, itemId: 2, itemCode: 'MAC-M3-16', itemName: 'MacBook Air M3 16GB/512GB', unitName: 'Máy', unitPrice: 29500000, minQuantity: 20, discountPercent: 10.5 },
        { id: 10, itemId: 3, itemCode: 'AIRP-PRO2', itemName: 'AirPods Pro 2 USB-C', unitName: 'Hộp', unitPrice: 5100000, minQuantity: 10, discountPercent: 15 }
      ]
    },
    {
      id: 3,
      externalId: '018f8e00-0003-7000-8000-000000000003',
      code: 'PL-PROMO-SUMMER',
      name: 'Chương trình Giá Khuyến mãi Mùa hè 2026',
      currency: 'VND',
      effectiveFrom: '2026-06-01T00:00:00Z',
      effectiveTo: '2026-08-31T23:59:59Z',
      branchId: undefined,
      branchName: 'Toàn hệ thống',
      isActive: false,
      notes: 'Bảng giá dự kiến cho chiến dịch hè, kích cầu phụ kiện.',
      items: [
        { id: 11, itemId: 3, itemCode: 'AIRP-PRO2', itemName: 'AirPods Pro 2 USB-C', unitName: 'Hộp', unitPrice: 5490000, minQuantity: 1, discountPercent: 8.3 }
      ]
    }
  ];

  private mockQuotations: SalesQuotationDetailDto[] = [
    {
      id: 1,
      externalId: '018f8e00-0010-7000-8000-000000000010',
      quotationNumber: 'BG-202611-0001',
      quotationDate: '2026-11-01T08:30:00Z',
      validUntil: '2026-11-15T23:59:59Z',
      customerId: 1,
      customerName: 'Công ty TNHH Công nghệ FPT Smart',
      customerPhone: '0901234567',
      customerEmail: 'procurement@fpt-smart.vn',
      branchId: 1,
      branchName: 'Chi nhánh Hà Nội',
      salespersonId: 1,
      salespersonName: 'Phạm Hữu Lợi',
      priceListId: 2,
      priceListName: 'Bảng giá Đại lý Cấp 1 & Đối tác B2B',
      status: 'Sent',
      subTotal: 520000000,
      discountAmount: 26000000,
      totalAmount: 494000000,
      notes: 'Báo giá 20 chiếc iPhone 15 Pro phục vụ dự án đối tác.',
      termsAndConditions: 'Thanh toán đợt 1 50% khi xác nhận đơn hàng, 50% trong vòng 15 ngày sau giao hàng. Bảo hành 12 tháng chính hãng.',
      items: [
        {
          id: 1,
          itemId: 1,
          itemCode: 'IP15P-128',
          itemName: 'iPhone 15 Pro 128GB',
          unitName: 'Cái',
          quantity: 20,
          unitPrice: 26000000,
          discountAmount: 26000000,
          lineTotal: 494000000,
          notes: 'Giao kèm hóa đơn VAT điện tử'
        }
      ]
    },
    {
      id: 2,
      externalId: '018f8e00-0011-7000-8000-000000000011',
      quotationNumber: 'BG-202611-0002',
      quotationDate: '2026-11-02T10:15:00Z',
      validUntil: '2026-11-20T23:59:59Z',
      customerId: 2,
      customerName: 'Tập đoàn Bán lẻ Viettel Telecom',
      customerPhone: '0988776655',
      customerEmail: 'contact@viettel-retail.vn',
      branchId: 2,
      branchName: 'Chi nhánh TP. Hồ Chí Minh',
      salespersonId: 2,
      salespersonName: 'Võ Quốc Thiện',
      priceListId: 2,
      priceListName: 'Bảng giá Đại lý Cấp 1 & Đối tác B2B',
      status: 'Draft',
      subTotal: 305000000,
      discountAmount: 0,
      totalAmount: 305000000,
      notes: 'Báo giá lô thiết bị văn phòng 10 máy MacBook Air M3.',
      termsAndConditions: 'Hạn mức công nợ 30 ngày.',
      items: [
        {
          id: 2,
          itemId: 2,
          itemCode: 'MAC-M3-16',
          itemName: 'MacBook Air M3 16GB/512GB',
          unitName: 'Máy',
          quantity: 10,
          unitPrice: 30500000,
          discountAmount: 0,
          lineTotal: 305000000
        }
      ]
    }
  ];

  private mockOrders: SalesOrderDetailDto[] = [
    {
      id: 1,
      externalId: '018f8e00-0020-7000-8000-000000000020',
      orderNumber: 'SO-202611-0001',
      orderDate: '2026-11-01T09:00:00Z',
      expectedDeliveryDate: '2026-11-05T17:00:00Z',
      customerId: 1,
      customerName: 'Công ty TNHH Công nghệ FPT Smart',
      customerCreditLimit: 500000000,
      customerCurrentDebt: 120000000,
      branchId: 1,
      branchName: 'Chi nhánh Hà Nội',
      warehouseId: 1,
      warehouseName: 'Kho Tổng Miền Bắc',
      salespersonId: 1,
      salespersonName: 'Phạm Hữu Lợi',
      quotationId: 1,
      quotationNumber: 'BG-202611-0001',
      priceListId: 2,
      priceListName: 'Bảng giá Đại lý Cấp 1 & Đối tác B2B',
      status: 'Confirmed',
      creditCheckStatus: 'Pass',
      deliveryAddress: 'Tòa nhà FPT, Phố Duy Tân, Cầu Giấy, Hà Nội',
      subTotal: 260000000,
      discountAmount: 13000000,
      totalAmount: 247000000,
      paidAmount: 123500000,
      stockReserved: true,
      notes: 'Đã giữ chỗ tồn kho 10 cái iPhone 15 Pro.',
      items: [
        {
          id: 1,
          itemId: 1,
          itemCode: 'IP15P-128',
          itemName: 'iPhone 15 Pro 128GB',
          unitName: 'Cái',
          quantity: 10,
          unitPrice: 26000000,
          discountAmount: 13000000,
          lineTotal: 247000000,
          reservedQuantity: 10,
          deliveredQuantity: 0,
          invoicedQuantity: 0,
          notes: 'Đã giữ chỗ khả dụng'
        }
      ]
    },
    {
      id: 2,
      externalId: '018f8e00-0021-7000-8000-000000000021',
      orderNumber: 'SO-202611-0002',
      orderDate: '2026-11-02T11:00:00Z',
      expectedDeliveryDate: '2026-11-06T15:00:00Z',
      customerId: 3,
      customerName: 'Chuỗi Cửa hàng Điện máy Sao Vàng',
      customerCreditLimit: 200000000,
      customerCurrentDebt: 185000000,
      branchId: 1,
      branchName: 'Chi nhánh Hà Nội',
      warehouseId: 1,
      warehouseName: 'Kho Tổng Miền Bắc',
      salespersonId: 1,
      salespersonName: 'Phạm Hữu Lợi',
      priceListId: 2,
      priceListName: 'Bảng giá Đại lý Cấp 1 & Đối tác B2B',
      status: 'PendingApproval',
      creditCheckStatus: 'ExceededPendingApproval',
      deliveryAddress: 'Số 45 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
      subTotal: 152500000,
      discountAmount: 0,
      totalAmount: 152500000,
      paidAmount: 0,
      stockReserved: false,
      notes: 'CẢNH BÁO: Đơn hàng làm tổng dư nợ (337.5M) vượt hạn mức tín dụng 200M! Yêu cầu Trưởng phòng phê duyệt hạn mức nợ.',
      items: [
        {
          id: 2,
          itemId: 2,
          itemCode: 'MAC-M3-16',
          itemName: 'MacBook Air M3 16GB/512GB',
          unitName: 'Máy',
          quantity: 5,
          unitPrice: 30500000,
          discountAmount: 0,
          lineTotal: 152500000,
          reservedQuantity: 0,
          deliveredQuantity: 0,
          invoicedQuantity: 0
        }
      ]
    }
  ];

  private mockReturns: SalesReturnDetailDto[] = [
    {
      id: 1,
      externalId: '018f8e00-0030-7000-8000-000000000030',
      returnNumber: 'SR-202611-0001',
      returnDate: '2026-11-02T14:00:00Z',
      invoiceId: 101,
      invoiceNumber: 'INV-202610-0055',
      customerId: 1,
      customerName: 'Công ty TNHH Công nghệ FPT Smart',
      branchId: 1,
      branchName: 'Chi nhánh Hà Nội',
      warehouseId: 1,
      warehouseName: 'Kho Tổng Miền Bắc',
      totalRefundAmount: 26000000,
      refundMethod: RefundMethod.ReduceDebt,
      refundMethodName: 'Giảm trừ công nợ',
      status: 'Posted',
      stockReceiptId: 301,
      journalEntryId: 501,
      reason: 'Sản phẩm lỗi cảm ứng màn hình, đổi mới hoặc hoàn tiền giảm trừ nợ',
      notes: 'Đã sinh phiếu nhập kho hoàn hàng #301 và bút toán Nợ 521 / Có 131 #501.',
      items: [
        {
          id: 1,
          invoiceItemId: 201,
          itemId: 1,
          itemCode: 'IP15P-128',
          itemName: 'iPhone 15 Pro 128GB',
          unitName: 'Cái',
          returnQuantity: 1,
          unitPrice: 26000000,
          refundAmount: 26000000,
          reason: 'Lỗi phần cứng camera sau'
        }
      ]
    }
  ];

  constructor(private http: HttpClient) {
    // Initial data hydration
    this.priceLists.set([...this.mockPriceLists]);
    this.quotations.set([...this.mockQuotations]);
    this.orders.set([...this.mockOrders]);
    this.returns.set([...this.mockReturns]);
  }

  // ==========================================
  // 1. PRICE LISTS (Phase 22.1)
  // ==========================================

  public loadPriceLists(): void {
    this.isLoading.set(true);
    if (this.useMock()) {
      setTimeout(() => {
        this.priceLists.set([...this.mockPriceLists]);
        this.isLoading.set(false);
      }, 100);
      return;
    }

    this.http.get<ApiResponse<PagedResult<PriceListDetailDto>>>(`${this.apiUrl}/price-lists`).pipe(
      map(res => res.data?.items ?? []),
      catchError(() => of(this.mockPriceLists))
    ).subscribe(items => {
      this.priceLists.set(items);
      this.isLoading.set(false);
    });
  }

  public getPriceList(id: number): Observable<PriceListDetailDto> {
    if (this.useMock()) {
      const pl = this.mockPriceLists.find(p => p.id === id);
      return pl ? of({ ...pl }) : throwError(() => new Error('Price list not found'));
    }
    return this.http.get<ApiResponse<PriceListDetailDto>>(`${this.apiUrl}/price-lists/${id}`).pipe(
      map(res => res.data),
      catchError(() => {
        const pl = this.mockPriceLists.find(p => p.id === id);
        return pl ? of({ ...pl }) : throwError(() => new Error('Price list not found'));
      })
    );
  }

  public savePriceList(req: CreatePriceListRequest, id?: number): Observable<PriceListDetailDto> {
    if (this.useMock()) {
      if (id) {
        const index = this.mockPriceLists.findIndex(p => p.id === id);
        if (index >= 0) {
          const updated: PriceListDetailDto = {
            ...this.mockPriceLists[index],
            ...req,
            items: req.items.map((it, idx) => ({
              id: idx + 1,
              itemId: it.itemId,
              itemCode: 'ITEM-' + it.itemId,
              itemName: 'Sản phẩm #' + it.itemId,
              unitPrice: it.unitPrice,
              minQuantity: it.minQuantity,
              discountPercent: it.discountPercent
            }))
          };
          this.mockPriceLists[index] = updated;
          this.priceLists.set([...this.mockPriceLists]);
          return of(updated);
        }
      }

      const newId = this.mockPriceLists.length > 0 ? Math.max(...this.mockPriceLists.map(p => p.id)) + 1 : 1;
      const created: PriceListDetailDto = {
        id: newId,
        externalId: crypto.randomUUID(),
        code: req.code,
        name: req.name,
        currency: req.currency || 'VND',
        effectiveFrom: req.effectiveFrom,
        effectiveTo: req.effectiveTo,
        branchId: req.branchId,
        branchName: req.branchId === 1 ? 'Chi nhánh Miền Bắc' : (req.branchId === 2 ? 'Chi nhánh Miền Nam' : 'Toàn hệ thống'),
        isActive: req.isActive,
        notes: req.notes,
        items: req.items.map((it, idx) => ({
          id: idx + 1,
          itemId: it.itemId,
          itemCode: 'SKU-' + it.itemId,
          itemName: 'Sản phẩm mẫu #' + it.itemId,
          unitName: 'Cái',
          unitPrice: it.unitPrice,
          minQuantity: it.minQuantity,
          discountPercent: it.discountPercent
        }))
      };
      this.mockPriceLists.unshift(created);
      this.priceLists.set([...this.mockPriceLists]);
      return of(created);
    }

    if (id) {
      return this.http.put<ApiResponse<PriceListDetailDto>>(`${this.apiUrl}/price-lists/${id}`, req).pipe(
        map(res => res.data),
        tap(() => this.loadPriceLists())
      );
    }
    return this.http.post<ApiResponse<PriceListDetailDto>>(`${this.apiUrl}/price-lists`, req).pipe(
      map(res => res.data),
      tap(() => this.loadPriceLists())
    );
  }

  public deletePriceList(id: number): Observable<boolean> {
    if (this.useMock()) {
      this.mockPriceLists = this.mockPriceLists.filter(p => p.id !== id);
      this.priceLists.set([...this.mockPriceLists]);
      return of(true);
    }
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/price-lists/${id}`).pipe(
      map(res => res.data),
      tap(() => this.loadPriceLists())
    );
  }

  public calculatePrice(req: CalculatePriceRequest): Observable<CalculatePriceResponse> {
    if (this.useMock()) {
      // Find matching active price list for branch or system-wide
      const applicablePl = this.mockPriceLists.find(pl => pl.isActive && (pl.branchId === undefined || pl.branchId === req.branchId));
      const resultLines: any[] = req.items.map(reqItem => {
        const plItem = applicablePl?.items.filter(it => it.itemId === reqItem.itemId && reqItem.quantity >= it.minQuantity)
          .sort((a, b) => b.minQuantity - a.minQuantity)[0];

        const originalPrice = 28500000;
        const unitPrice = plItem ? plItem.unitPrice : originalPrice;
        const discountPercent = plItem ? plItem.discountPercent : 0;
        const discountAmount = (unitPrice * (discountPercent / 100)) * reqItem.quantity;
        const lineTotal = (unitPrice * reqItem.quantity) - discountAmount;

        return {
          itemId: reqItem.itemId,
          itemCode: plItem?.itemCode ?? 'SKU-' + reqItem.itemId,
          itemName: plItem?.itemName ?? 'Sản phẩm #' + reqItem.itemId,
          appliedPriceListId: applicablePl?.id,
          appliedPriceListName: applicablePl?.name,
          originalPrice,
          unitPrice,
          discountPercent,
          discountAmount,
          quantity: reqItem.quantity,
          lineTotal
        };
      });

      return of({
        items: resultLines,
        totalAmount: resultLines.reduce((acc, curr) => acc + curr.lineTotal, 0)
      });
    }

    return this.http.post<ApiResponse<CalculatePriceResponse>>(`${this.apiUrl}/price-lists/calculate-price`, req).pipe(
      map(res => res.data)
    );
  }

  // ==========================================
  // 2. SALES QUOTATIONS (Phase 22.2)
  // ==========================================

  public loadQuotations(): void {
    this.isLoading.set(true);
    if (this.useMock()) {
      setTimeout(() => {
        this.quotations.set([...this.mockQuotations]);
        this.isLoading.set(false);
      }, 100);
      return;
    }

    this.http.get<ApiResponse<PagedResult<SalesQuotationDetailDto>>>(`${this.apiUrl}/quotations`).pipe(
      map(res => res.data?.items ?? []),
      catchError(() => of(this.mockQuotations))
    ).subscribe(items => {
      this.quotations.set(items);
      this.isLoading.set(false);
    });
  }

  public getQuotation(id: number): Observable<SalesQuotationDetailDto> {
    const q = this.mockQuotations.find(item => item.id === id);
    return q ? of({ ...q }) : throwError(() => new Error('Quotation not found'));
  }

  public saveQuotation(req: CreateSalesQuotationRequest, id?: number): Observable<SalesQuotationDetailDto> {
    const subTotal = req.items.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);
    const discountAmount = req.items.reduce((sum, it) => sum + (it.discountAmount || 0), 0);
    const totalAmount = subTotal - discountAmount;

    if (id) {
      const idx = this.mockQuotations.findIndex(q => q.id === id);
      if (idx >= 0) {
        const updated: SalesQuotationDetailDto = {
          ...this.mockQuotations[idx],
          ...req,
          subTotal,
          discountAmount,
          totalAmount,
          items: req.items.map((it, i) => ({
            id: i + 1,
            itemId: it.itemId,
            itemCode: 'SKU-' + it.itemId,
            itemName: 'Sản phẩm #' + it.itemId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            discountAmount: it.discountAmount,
            lineTotal: (it.unitPrice * it.quantity) - it.discountAmount,
            notes: it.notes
          }))
        };
        this.mockQuotations[idx] = updated;
        this.quotations.set([...this.mockQuotations]);
        return of(updated);
      }
    }

    const newId = this.mockQuotations.length > 0 ? Math.max(...this.mockQuotations.map(q => q.id)) + 1 : 1;
    const nowStr = new Date().toISOString();
    const created: SalesQuotationDetailDto = {
      id: newId,
      externalId: crypto.randomUUID(),
      quotationNumber: `BG-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(newId).padStart(4, '0')}`,
      quotationDate: nowStr,
      validUntil: req.validUntil,
      customerId: req.customerId,
      customerName: req.customerId === 1 ? 'Công ty TNHH Công nghệ FPT Smart' : 'Khách hàng B2B #' + req.customerId,
      branchId: req.branchId,
      branchName: 'Chi nhánh Hà Nội',
      salespersonId: req.salespersonId || 1,
      salespersonName: 'Phạm Hữu Lợi',
      priceListId: req.priceListId,
      priceListName: 'Bảng giá Đại lý Cấp 1 & Đối tác B2B',
      status: 'Draft',
      subTotal,
      discountAmount,
      totalAmount,
      notes: req.notes,
      termsAndConditions: req.termsAndConditions || 'Thanh toán 100% trong 15 ngày.',
      items: req.items.map((it, i) => ({
        id: i + 1,
        itemId: it.itemId,
        itemCode: 'SKU-' + it.itemId,
        itemName: 'Sản phẩm #' + it.itemId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discountAmount: it.discountAmount,
        lineTotal: (it.unitPrice * it.quantity) - it.discountAmount,
        notes: it.notes
      }))
    };
    this.mockQuotations.unshift(created);
    this.quotations.set([...this.mockQuotations]);
    return of(created);
  }

  public sendQuotationEmail(id: number): Observable<boolean> {
    const q = this.mockQuotations.find(item => item.id === id);
    if (q) {
      q.status = 'Sent';
      this.quotations.set([...this.mockQuotations]);
    }
    return of(true);
  }

  public convertQuotationToOrder(id: number): Observable<SalesOrderDetailDto> {
    const q = this.mockQuotations.find(item => item.id === id);
    if (!q) return throwError(() => new Error('Quotation not found'));

    q.status = 'Converted';
    this.quotations.set([...this.mockQuotations]);

    const newOrderId = this.mockOrders.length > 0 ? Math.max(...this.mockOrders.map(o => o.id)) + 1 : 1;
    const newOrder: SalesOrderDetailDto = {
      id: newOrderId,
      externalId: crypto.randomUUID(),
      orderNumber: `SO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(newOrderId).padStart(4, '0')}`,
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      customerId: q.customerId,
      customerName: q.customerName,
      customerCreditLimit: 500000000,
      customerCurrentDebt: 100000000,
      branchId: q.branchId,
      branchName: q.branchName,
      warehouseId: 1,
      warehouseName: 'Kho Tổng Miền Bắc',
      salespersonId: q.salespersonId,
      salespersonName: q.salespersonName,
      quotationId: q.id,
      quotationNumber: q.quotationNumber,
      priceListId: q.priceListId,
      priceListName: q.priceListName,
      status: 'Confirmed',
      creditCheckStatus: 'Pass',
      deliveryAddress: 'Giao tại địa chỉ công ty khách hàng',
      subTotal: q.subTotal,
      discountAmount: q.discountAmount,
      totalAmount: q.totalAmount,
      paidAmount: 0,
      stockReserved: true,
      notes: `Được tạo tự động từ Báo giá ${q.quotationNumber}`,
      items: q.items.map((it, i) => ({
        id: i + 1,
        itemId: it.itemId,
        itemCode: it.itemCode,
        itemName: it.itemName,
        unitName: it.unitName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discountAmount: it.discountAmount,
        lineTotal: it.lineTotal,
        reservedQuantity: it.quantity,
        deliveredQuantity: 0,
        invoicedQuantity: 0,
        notes: it.notes
      }))
    };

    this.mockOrders.unshift(newOrder);
    this.orders.set([...this.mockOrders]);
    return of(newOrder);
  }

  // ==========================================
  // 3. SALES ORDERS (Phase 22.3)
  // ==========================================

  public loadOrders(): void {
    this.isLoading.set(true);
    if (this.useMock()) {
      setTimeout(() => {
        this.orders.set([...this.mockOrders]);
        this.isLoading.set(false);
      }, 100);
      return;
    }

    this.http.get<ApiResponse<PagedResult<SalesOrderDetailDto>>>(`${this.apiUrl}/orders`).pipe(
      map(res => res.data?.items ?? []),
      catchError(() => of(this.mockOrders))
    ).subscribe(items => {
      this.orders.set(items);
      this.isLoading.set(false);
    });
  }

  public getOrder(id: number): Observable<SalesOrderDetailDto> {
    const o = this.mockOrders.find(item => item.id === id);
    return o ? of({ ...o }) : throwError(() => new Error('Order not found'));
  }

  public saveOrder(req: CreateSalesOrderRequest, id?: number): Observable<SalesOrderDetailDto> {
    const subTotal = req.items.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);
    const discountAmount = req.items.reduce((sum, it) => sum + (it.discountAmount || 0), 0);
    const totalAmount = subTotal - discountAmount;

    // Simulate credit check: if total amount > 150M mark as PendingApproval
    const customerCreditLimit = 200000000;
    const currentDebt = 120000000;
    const exceedsCredit = (currentDebt + totalAmount) > customerCreditLimit;

    if (id) {
      const idx = this.mockOrders.findIndex(o => o.id === id);
      if (idx >= 0) {
        const updated: SalesOrderDetailDto = {
          ...this.mockOrders[idx],
          ...req,
          subTotal,
          discountAmount,
          totalAmount,
          creditCheckStatus: exceedsCredit ? 'ExceededPendingApproval' : 'Pass',
          status: exceedsCredit ? 'PendingApproval' : 'Confirmed',
          items: req.items.map((it, i) => ({
            id: i + 1,
            itemId: it.itemId,
            itemCode: 'SKU-' + it.itemId,
            itemName: 'Sản phẩm #' + it.itemId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            discountAmount: it.discountAmount,
            lineTotal: (it.unitPrice * it.quantity) - it.discountAmount,
            notes: it.notes
          }))
        };
        this.mockOrders[idx] = updated;
        this.orders.set([...this.mockOrders]);
        return of(updated);
      }
    }

    const newId = this.mockOrders.length > 0 ? Math.max(...this.mockOrders.map(o => o.id)) + 1 : 1;
    const created: SalesOrderDetailDto = {
      id: newId,
      externalId: crypto.randomUUID(),
      orderNumber: `SO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(newId).padStart(4, '0')}`,
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: req.expectedDeliveryDate,
      customerId: req.customerId,
      customerName: req.customerId === 1 ? 'Công ty TNHH Công nghệ FPT Smart' : (req.customerId === 2 ? 'Tập đoàn Viettel Telecom' : 'Khách hàng Doanh nghiệp #' + req.customerId),
      customerCreditLimit,
      customerCurrentDebt: currentDebt,
      branchId: req.branchId,
      branchName: 'Chi nhánh Hà Nội',
      warehouseId: req.warehouseId,
      warehouseName: 'Kho Tổng Miền Bắc',
      salespersonId: req.salespersonId || 1,
      salespersonName: 'Phạm Hữu Lợi',
      priceListId: req.priceListId,
      priceListName: 'Bảng giá Đại lý Cấp 1 & Đối tác B2B',
      status: exceedsCredit ? 'PendingApproval' : 'Confirmed',
      creditCheckStatus: exceedsCredit ? 'ExceededPendingApproval' : 'Pass',
      deliveryAddress: req.deliveryAddress || 'Kho khách hàng',
      subTotal,
      discountAmount,
      totalAmount,
      paidAmount: 0,
      stockReserved: !exceedsCredit,
      notes: req.notes,
      items: req.items.map((it, i) => ({
        id: i + 1,
        itemId: it.itemId,
        itemCode: 'SKU-' + it.itemId,
        itemName: 'Sản phẩm #' + it.itemId,
        unitName: 'Cái',
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discountAmount: it.discountAmount,
        lineTotal: (it.unitPrice * it.quantity) - it.discountAmount,
        reservedQuantity: exceedsCredit ? 0 : it.quantity,
        deliveredQuantity: 0,
        invoicedQuantity: 0,
        notes: it.notes
      }))
    };

    this.mockOrders.unshift(created);
    this.orders.set([...this.mockOrders]);
    return of(created);
  }

  public confirmOrder(id: number): Observable<boolean> {
    const o = this.mockOrders.find(item => item.id === id);
    if (o) {
      o.status = 'Confirmed';
      o.stockReserved = true;
      o.items.forEach(it => it.reservedQuantity = it.quantity);
      this.orders.set([...this.mockOrders]);
    }
    return of(true);
  }

  public approveCredit(id: number): Observable<boolean> {
    const o = this.mockOrders.find(item => item.id === id);
    if (o) {
      o.creditCheckStatus = 'Approved';
      o.status = 'Confirmed';
      o.stockReserved = true;
      o.items.forEach(it => it.reservedQuantity = it.quantity);
      this.orders.set([...this.mockOrders]);
    }
    return of(true);
  }

  public cancelOrder(id: number): Observable<boolean> {
    const o = this.mockOrders.find(item => item.id === id);
    if (o) {
      o.status = 'Cancelled';
      o.stockReserved = false;
      o.items.forEach(it => it.reservedQuantity = 0);
      this.orders.set([...this.mockOrders]);
    }
    return of(true);
  }

  // ==========================================
  // 4. SALES RETURNS (Phase 22.4)
  // ==========================================

  public loadReturns(): void {
    this.isLoading.set(true);
    if (this.useMock()) {
      setTimeout(() => {
        this.returns.set([...this.mockReturns]);
        this.isLoading.set(false);
      }, 100);
      return;
    }

    this.http.get<ApiResponse<PagedResult<SalesReturnDetailDto>>>(`${this.apiUrl}/returns`).pipe(
      map(res => res.data?.items ?? []),
      catchError(() => of(this.mockReturns))
    ).subscribe(items => {
      this.returns.set(items);
      this.isLoading.set(false);
    });
  }

  public getReturn(id: number): Observable<SalesReturnDetailDto> {
    const r = this.mockReturns.find(item => item.id === id);
    return r ? of({ ...r }) : throwError(() => new Error('Return slip not found'));
  }

  public createReturn(req: CreateSalesReturnRequest): Observable<SalesReturnDetailDto> {
    const totalRefundAmount = req.items.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);
    const newId = this.mockReturns.length > 0 ? Math.max(...this.mockReturns.map(r => r.id)) + 1 : 1;

    const methodNames: Record<RefundMethod, string> = {
      [RefundMethod.Cash]: 'Tiền mặt',
      [RefundMethod.BankTransfer]: 'Chuyển khoản',
      [RefundMethod.ReduceDebt]: 'Giảm trừ công nợ'
    };

    const created: SalesReturnDetailDto = {
      id: newId,
      externalId: crypto.randomUUID(),
      returnNumber: `SR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(newId).padStart(4, '0')}`,
      returnDate: new Date().toISOString(),
      invoiceId: req.invoiceId,
      invoiceNumber: req.invoiceId ? `INV-202610-00${req.invoiceId}` : undefined,
      customerId: req.customerId,
      customerName: req.customerId === 1 ? 'Công ty TNHH Công nghệ FPT Smart' : 'Khách hàng #' + req.customerId,
      branchId: req.branchId,
      branchName: 'Chi nhánh Hà Nội',
      warehouseId: req.warehouseId,
      warehouseName: 'Kho Tổng Miền Bắc',
      totalRefundAmount,
      refundMethod: req.refundMethod,
      refundMethodName: methodNames[req.refundMethod],
      status: 'Posted',
      stockReceiptId: 400 + newId,
      journalEntryId: 600 + newId,
      reason: req.reason,
      notes: req.notes,
      items: req.items.map((it, i) => ({
        id: i + 1,
        invoiceItemId: it.invoiceItemId,
        itemId: it.itemId,
        itemCode: 'SKU-' + it.itemId,
        itemName: 'Sản phẩm #' + it.itemId,
        unitName: 'Cái',
        returnQuantity: it.quantity,
        unitPrice: it.unitPrice,
        refundAmount: it.unitPrice * it.quantity,
        reason: it.reason
      }))
    };

    this.mockReturns.unshift(created);
    this.returns.set([...this.mockReturns]);
    return of(created);
  }
}
