import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationStateService } from '../../../core/services/notification-state.service';
import { NotificationItem } from '../../../core/models/notification.model';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-notification-popover',
  standalone: true,
  imports: [CommonModule, RelativeTimePipe, TranslatePipe],
  templateUrl: './notification-popover.component.html',
  styleUrls: ['./notification-popover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationPopoverComponent {
  public notifState = inject(NotificationStateService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.notifState.isPopoverOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  public onEscape(): void {
    this.notifState.isPopoverOpen.set(false);
  }

  public onItemClick(item: NotificationItem): void {
    if (!item.isRead) {
      this.notifState.markAsRead(item.id);
    }
    this.notifState.isPopoverOpen.set(false);
    if (item.actionUrl) {
      this.router.navigateByUrl(item.actionUrl);
    }
  }

  public onViewAll(): void {
    this.notifState.isPopoverOpen.set(false);
    this.router.navigateByUrl('/notifications');
  }

  public onOpenPreferences(): void {
    this.notifState.isPopoverOpen.set(false);
    this.router.navigateByUrl('/notifications/preferences');
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
