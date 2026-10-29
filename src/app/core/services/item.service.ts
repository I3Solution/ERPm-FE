import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, map, tap } from 'rxjs';

export enum AttributeDataType {
  Text = 1,
  Number = 2,
  Select = 3,
  Date = 4,
  Boolean = 5
}

export interface ItemAttributeDto {
  id: number;
  categoryId?: number;
  categoryName?: string;
  code: string;
  name: string;
  dataType: AttributeDataType;
  options: string[];
  unit?: string;
  isRequired: boolean;
  isFilterable: boolean;
  sortOrder: number;
}

export interface ItemDto {
  id: number;
  code: string;
  barcode?: string;
  name: string;
  translations: Record<string, string>;
  itemType: number;
  categoryId?: number;
  categoryName?: string;
  baseUomId: number;
  baseUomName?: string;
  salePrice: number;
  costPrice: number;
  minStockAlert: number;
  maxStockAlert: number;
  imageUrl?: string;
  description?: string;
  isActive: boolean;
  attributes?: Record<string, any>;
}

export interface CreateItemRequest {
  code: string;
  barcode?: string;
  name: string;
  translations?: Record<string, string>;
  itemType: number;
  categoryId?: number;
  baseUomId: number;
  salePrice: number;
  costPrice: number;
  minStockAlert: number;
  maxStockAlert: number;
  description?: string;
  attributes?: Record<string, any>;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private readonly apiUrl = '/api/v1/items';
  private readonly attributesApiUrl = '/api/v1/wms/item-attributes';

  // Signals
  public items = signal<ItemDto[]>([]);
  public attributes = signal<ItemAttributeDto[]>([]);
  public isLoading = signal<boolean>(false);

  public pageIndex = signal(1);
  public totalCount = signal(0);
  public totalPages = signal(0);
  public categories = signal<{ id: number; name: string }[]>([]);
  public units = signal<{ id: number; name: string }[]>([]);
  private request?: Subscription;
  constructor(private http: HttpClient) {}
  public loadReferenceData(): void {
    this.http.get<{ data: PagedResult<{ id: number; name: string }> }>('/api/v1/wms/categories?pageSize=200').subscribe(r => this.categories.set(r.data.items));
    this.http.get<{ data: PagedResult<{ id: number; name: string }> }>('/api/v1/wms/units-of-measure?pageSize=200').subscribe(r => this.units.set(r.data.items));
  }

  public loadItems(keyword = '', pageIndex = 1): void {
    this.request?.unsubscribe();
    this.isLoading.set(true);
    const url = `${this.apiUrl}?keyword=${encodeURIComponent(keyword)}&pageIndex=${pageIndex}&pageSize=50&isActive=true`;

    this.request = this.http.get<{ success: boolean; data: PagedResult<ItemDto> }>(url)
      .subscribe({
        next: (res) => {
          if (res && res.success && res.data) {
            this.items.set(res.data.items);
            this.pageIndex.set(res.data.pageIndex); this.totalPages.set(res.data.totalPages); this.totalCount.set(res.data.totalCount);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load items:', err);
          this.isLoading.set(false);
        }
      });
  }

  public loadAttributes(categoryId?: number): void {
    const url = categoryId
      ? `${this.attributesApiUrl}/by-category/${categoryId}`
      : `${this.attributesApiUrl}/by-category`;

    this.http.get<{ success: boolean; data: ItemAttributeDto[] }>(url)

      .subscribe({
        next: (res) => {
          if (res && res.data && res.data.length > 0) {
            this.attributes.set(res.data);
          } else {
            this.attributes.set([]);
          }
        }
      });
  }

  public createItem(request: CreateItemRequest): Observable<ItemDto> {
    return this.http.post<{ success: boolean; data: ItemDto }>(this.apiUrl, request)
      .pipe(
        map(res => res.data),
        tap(() => this.loadItems())
      );
  }
}
