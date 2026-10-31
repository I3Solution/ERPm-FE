import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { NotificationItem, NotificationListResponse } from '../../../core/models/notification.model';
import { NotificationStateService } from '../../../core/services/notification-state.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe, RelativeTimePipe],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsComponent implements OnInit {
  private http = inject(HttpClient);
  public router = inject(Router);
  public notifState = inject(NotificationStateService);

  private baseUrl = `${environment.apiBaseUrl}/api/v1/sys/notifications`;

  public items = signal<NotificationItem[]>([]);
  public totalCount = signal<number>(0);
  public pageIndex = signal<number>(1);
  public pageSize = signal<number>(15);
  public isLoading = signal<boolean>(false);

  // Filters
  public filterCategory = signal<string>('ALL');
  public filterSeverity = signal<string>('ALL');
  public filterReadStatus = signal<string>('ALL');

  public readonly categories = [
    { code: 'ALL', label: 'Tất cả phân hệ' },
    { code: 'SD', label: 'Bán hàng (SD)' },
    { code: 'WMS', label: 'Tồn kho (WMS)' },
    { code: 'PUR', label: 'Mua hàng (PUR)' },
    { code: 'ACC', label: 'Kế toán (ACC)' },
    { code: 'CRM', label: 'Khách hàng (CRM)' },
    { code: 'HRM', label: 'Nhân sự (HRM)' },
    { code: 'SYS', label: 'Hệ thống (SYS)' }
  ];

  public readonly severities = [
    { code: 'ALL', label: 'Tất cả mức độ' },
    { code: 'INFO', label: 'Thông tin (INFO)' },
    { code: 'SUCCESS', label: 'Thành công (SUCCESS)' },
    { code: 'WARNING', label: 'Cảnh báo (WARNING)' },
    { code: 'DANGER', label: 'Khẩn cấp (DANGER)' }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  public loadData(): void {
    this.isLoading.set(true);
    let url = `${this.baseUrl}?pageIndex=${this.pageIndex()}&pageSize=${this.pageSize()}`;

    if (this.filterCategory() !== 'ALL') {
      url += `&category=${this.filterCategory()}`;
    }
    if (this.filterSeverity() !== 'ALL') {
      url += `&severity=${this.filterSeverity()}`;
    }
    if (this.filterReadStatus() === 'UNREAD') {
      url += `&isRead=false`;
    } else if (this.filterReadStatus() === 'READ') {
      url += `&isRead=true`;
    }

    this.http.get<{ data: NotificationListResponse }>(url).subscribe({
      next: res => {
        this.isLoading.set(false);
        if (res?.data) {
          this.items.set(res.data.items);
          this.totalCount.set(res.data.totalCount);
          this.notifState.unreadCount.set(res.data.unreadCount);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  public onFilterChange(): void {
    this.pageIndex.set(1);
    this.loadData();
  }

  public onItemClick(item: NotificationItem): void {
    if (!item.isRead) {
      this.markAsRead(item);
    }
    if (item.actionUrl) {
      this.router.navigateByUrl(item.actionUrl);
    }
  }

  public markAsRead(item: NotificationItem): void {
    this.notifState.markAsRead(item.id);
    this.items.update(list =>
      list.map(n => (n.id === item.id ? { ...n, isRead: true } : n))
    );
  }

  public markAllAsRead(): void {
    this.notifState.markAllAsRead();
    this.items.update(list => list.map(n => ({ ...n, isRead: true })));
  }

  public archiveItem(item: NotificationItem, event: MouseEvent): void {
    event.stopPropagation();
    this.notifState.archive(item.id);
    this.items.update(list => list.filter(n => n.id !== item.id));
    this.totalCount.update(c => Math.max(0, c - 1));
  }

  public getCategoryIcon(category: string): string {
    switch (category?.toUpperCase()) {
      case 'SD': return '🛒';
      case 'WMS': return '📦';
      case 'PUR': return '📥';
      case 'ACC': return '💰';
      case 'CRM': return '👥';
      case 'HRM': return '👤';
      case 'SYS': return '⚙️';
      default: return '🔔';
    }
  }

  public setPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.pageIndex.set(page);
    this.loadData();
  }

  public totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize()) || 1;
  }
}
