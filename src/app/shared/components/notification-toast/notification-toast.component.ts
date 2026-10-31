import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationStateService } from '../../../core/services/notification-state.service';
import { NotificationItem } from '../../../core/models/notification.model';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule, RelativeTimePipe],
  templateUrl: './notification-toast.component.html',
  styleUrls: ['./notification-toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationToastComponent {
  public notifState = inject(NotificationStateService);
  private router = inject(Router);

  public onToastClick(toast: NotificationItem): void {
    this.notifState.dismissToast(toast.id);
    if (!toast.isRead) {
      this.notifState.markAsRead(toast.id);
    }
    if (toast.actionUrl) {
      this.router.navigateByUrl(toast.actionUrl);
    }
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
}
