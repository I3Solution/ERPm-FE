import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationStateService } from '../../../core/services/notification-state.service';
import { NotificationSignalRService } from '../../../core/services/notification-signalr.service';
import { NotificationPopoverComponent } from '../notification-popover/notification-popover.component';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, NotificationPopoverComponent],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationBellComponent implements OnInit {
  public notifState = inject(NotificationStateService);
  private signalR = inject(NotificationSignalRService);

  ngOnInit(): void {
    // Start real-time connection and hydrate counts
    this.signalR.startConnection();
    this.notifState.loadUnreadCount();
  }

  public togglePopover(event: MouseEvent): void {
    event.stopPropagation();
    const nextState = !this.notifState.isPopoverOpen();
    this.notifState.isPopoverOpen.set(nextState);
    if (nextState) {
      this.notifState.loadRecentNotifications(10);
    }
  }
}
