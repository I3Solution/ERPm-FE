import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NotificationItem, NotificationListResponse, UnreadCountResponse } from '../models/notification.model';
import { NotificationSignalRService } from './notification-signalr.service';
import { NotificationSoundService } from './notification-sound.service';

/**
 * Global reactive notification state store powered by Angular Signals.
 */
@Injectable({ providedIn: 'root' })
export class NotificationStateService {
  private http = inject(HttpClient);
  private signalR = inject(NotificationSignalRService);
  private soundService = inject(NotificationSoundService);

  private baseUrl = `${environment.apiBaseUrl}/api/v1/sys/notifications`;

  public unreadCount = signal<number>(0);
  public recentNotifications = signal<NotificationItem[]>([]);
  public isBellShaking = signal<boolean>(false);
  public activeToasts = signal<NotificationItem[]>([]);
  public isPopoverOpen = signal<boolean>(false);

  public hasUnread = computed(() => this.unreadCount() > 0);
  public badgeText = computed(() => {
    const count = this.unreadCount();
    if (count <= 0) return '';
    return count > 99 ? '99+' : count.toString();
  });

  constructor() {
    this.initSignalRListener();
  }

  private initSignalRListener(): void {
    this.signalR.onNotificationReceived((item: NotificationItem) => {
      this.handleIncomingNotification(item);
    });

    this.signalR.onReadSync((data: { recipientId: number }) => {
      this.recentNotifications.update(list =>
        list.map(n => (n.id === data.recipientId ? { ...n, isRead: true } : n))
      );
      this.unreadCount.update(c => Math.max(0, c - 1));
    });

    this.signalR.onAllReadSync(() => {
      this.recentNotifications.update(list => list.map(n => ({ ...n, isRead: true })));
      this.unreadCount.set(0);
    });
  }

  public handleIncomingNotification(item: NotificationItem): void {
    // 1. Update unread counter & recent list
    this.unreadCount.update(c => c + 1);
    this.recentNotifications.update(list => [item, ...list.slice(0, 19)]);

    // 2. Trigger bell shake animation
    this.triggerBellShake();

    // 3. Play chime
    this.soundService.playChime(item.severity);

    // 4. Pop toast notification
    this.activeToasts.update(toasts => [item, ...toasts.slice(0, 2)]);
    setTimeout(() => {
      this.dismissToast(item.id);
    }, 4500);
  }

  public triggerBellShake(): void {
    this.isBellShaking.set(true);
    setTimeout(() => {
      this.isBellShaking.set(false);
    }, 1200);
  }

  public dismissToast(id: number): void {
    this.activeToasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  public loadUnreadCount(): void {
    this.http.get<{ data: UnreadCountResponse }>(`${this.baseUrl}/unread-count`).subscribe({
      next: res => {
        if (res?.data) {
          this.unreadCount.set(res.data.unreadCount);
        }
      },
      error: () => {}
    });
  }

  public loadRecentNotifications(pageSize = 10): void {
    this.http
      .get<{ data: NotificationListResponse }>(`${this.baseUrl}?pageIndex=1&pageSize=${pageSize}`)
      .subscribe({
        next: res => {
          if (res?.data) {
            this.recentNotifications.set(res.data.items);
            this.unreadCount.set(res.data.unreadCount);
          }
        },
        error: () => {}
      });
  }

  public markAsRead(recipientId: number): void {
    this.http.put<{ success: boolean }>(`${this.baseUrl}/${recipientId}/read`, {}).subscribe({
      next: () => {
        this.recentNotifications.update(list =>
          list.map(n => (n.id === recipientId ? { ...n, isRead: true } : n))
        );
        this.unreadCount.update(c => Math.max(0, c - 1));
      },
      error: () => {}
    });
  }

  public markAllAsRead(): void {
    this.http.put<{ data: number }>(`${this.baseUrl}/read-all`, {}).subscribe({
      next: () => {
        this.recentNotifications.update(list => list.map(n => ({ ...n, isRead: true })));
        this.unreadCount.set(0);
      },
      error: () => {}
    });
  }

  public archive(recipientId: number): void {
    this.http.put<{ success: boolean }>(`${this.baseUrl}/${recipientId}/archive`, {}).subscribe({
      next: () => {
        this.recentNotifications.update(list => list.filter(n => n.id !== recipientId));
      },
      error: () => {}
    });
  }
}
