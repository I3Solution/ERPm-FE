/**
 * Enterprise Sales & Distribution (SD) Data Models and Contract Interfaces
 * Complies with Section 3 of plan-step-22-enterprise-sales-distribution.md
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

// ==========================================
// 1. Price Lists & Pricing Engine (Phase 22.1)
// ==========================================

export interface PriceListItemDto {
  id?: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  unitName?: string;
  unitPrice: number;            // decimal(18, 4)
  minQuantity: number;          // decimal(18, 4) - quantity tier
  discountPercent: number;      // decimal(18, 4)
}

export interface PriceListDetailDto {
  id: number;
  externalId: string;
  code: string;
  name: string;
  currency: string;
  effectiveFrom: string;        // ISO UTC
  effectiveTo?: string;         // ISO UTC
  branchId?: number;
  branchName?: string;
  isActive: boolean;
  notes?: string;
  items: PriceListItemDto[];
}

export interface CreatePriceListRequest {
  code: string;
  name: string;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  branchId?: number;
  isActive: boolean;
  notes?: string;
  items: {
    itemId: number;
    unitPrice: number;
    minQuantity: number;
    discountPercent: number;
  }[];
}

export interface CalculatePriceRequest {
  customerId?: number;
  branchId: number;
  items: {
    itemId: number;
    quantity: number;
  }[];
}

export interface CalculatedPriceLineDto {
  itemId: number;
  itemCode?: string;
  itemName?: string;
  appliedPriceListId?: number;
  appliedPriceListName?: string;
  originalPrice: number;
  unitPrice: number;          // Price after tier
  discountPercent: number;
  discountAmount: number;
  quantity?: number;
  lineTotal: number;
}

export interface CalculatePriceResponse {
  items: CalculatedPriceLineDto[];
  totalAmount?: number;
}

// ==========================================
// 2. Sales Quotations (Phase 22.2)
// ==========================================

export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Converted' | 'Expired';

export interface SalesQuotationItemDto {
  id?: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  unitName?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  notes?: string;
}

export interface SalesQuotationDetailDto {
  id: number;
  externalId: string;
  quotationNumber: string;      // BG-YYYYMM-XXXX
  quotationDate: string;
  validUntil: string;
  customerId: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  branchId: number;
  branchName?: string;
  salespersonId?: number;
  salespersonName?: string;
  priceListId?: number;
  priceListName?: string;
  status: QuotationStatus;
  subTotal: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  termsAndConditions?: string;
  items: SalesQuotationItemDto[];
}

export interface CreateSalesQuotationRequest {
  customerId: number;
  branchId: number;
  salespersonId?: number;
  priceListId?: number;
  validUntil: string;
  notes?: string;
  termsAndConditions?: string;
  items: {
    itemId: number;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    notes?: string;
  }[];
}

// ==========================================
// 3. Sales Orders (Phase 22.3)
// ==========================================

export type OrderStatus = 'Draft' | 'PendingApproval' | 'Confirmed' | 'Processing' | 'Completed' | 'Cancelled';
export type CreditCheckStatus = 'Pass' | 'ExceededPendingApproval' | 'Approved' | 'Rejected';

export interface SalesOrderItemDto {
  id?: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  unitName?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  reservedQuantity?: number;
  deliveredQuantity?: number;
  invoicedQuantity?: number;
  notes?: string;
}

export interface SalesOrderDetailDto {
  id: number;
  externalId: string;
  orderNumber: string;          // SO-YYYYMM-XXXX
  orderDate: string;
  expectedDeliveryDate?: string;
  customerId: number;
  customerName: string;
  customerCreditLimit?: number;
  customerCurrentDebt?: number;
  branchId: number;
  branchName?: string;
  warehouseId: number;
  warehouseName?: string;
  salespersonId?: number;
  salespersonName?: string;
  quotationId?: number;
  quotationNumber?: string;
  priceListId?: number;
  priceListName?: string;
  status: OrderStatus;
  creditCheckStatus: CreditCheckStatus;
  deliveryAddress?: string;
  subTotal: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  stockReserved: boolean;
  notes?: string;
  items: SalesOrderItemDto[];
}

export interface CreateSalesOrderRequest {
  quotationId?: number;
  customerId: number;
  branchId: number;
  warehouseId: number;
  salespersonId?: number;
  priceListId?: number;
  expectedDeliveryDate?: string;
  deliveryAddress?: string;
  notes?: string;
  items: {
    itemId: number;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    notes?: string;
  }[];
}

// ==========================================
// 4. Sales Returns (Phase 22.4)
// ==========================================

export enum RefundMethod {
  Cash = 1,
  BankTransfer = 2,
  ReduceDebt = 3
}

export interface SalesReturnItemDto {
  id?: number;
  invoiceItemId?: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  unitName?: string;
  returnQuantity: number;
  unitPrice: number;
  refundAmount: number;
  reason?: string;
}

export interface SalesReturnDetailDto {
  id: number;
  externalId: string;
  returnNumber: string;         // SR-YYYYMM-XXXX
  returnDate: string;
  invoiceId?: number;
  invoiceNumber?: string;
  customerId: number;
  customerName: string;
  branchId: number;
  branchName?: string;
  warehouseId: number;
  warehouseName?: string;
  totalRefundAmount: number;
  refundMethod: RefundMethod;
  refundMethodName?: string;
  status: 'Draft' | 'Posted';
  stockReceiptId?: number;
  journalEntryId?: number;
  reason?: string;
  notes?: string;
  items: SalesReturnItemDto[];
}

export interface CreateSalesReturnRequest {
  invoiceId?: number;
  customerId: number;
  branchId: number;
  warehouseId: number;
  refundMethod: RefundMethod;
  reason: string;
  notes?: string;
  items: {
    invoiceItemId?: number;
    itemId: number;
    quantity: number;
    unitPrice: number;
    reason?: string;
  }[];
}

// ==========================================
// 5. Print Templates (Phase 22.6)
// ==========================================

export type PrintTemplateType = 'k80' | 'a4' | 'a5';

export interface PrintDocumentData {
  title: string;
  documentNumber: string;
  documentDate: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyTaxCode?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  salespersonName?: string;
  warehouseName?: string;
  branchName?: string;
  subTotal: number;
  discountAmount: number;
  vatAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  remainingAmount?: number;
  amountInWords?: string;
  notes?: string;
  terms?: string;
  items: {
    index: number;
    itemCode: string;
    itemName: string;
    unitName: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    lineTotal: number;
  }[];
}
