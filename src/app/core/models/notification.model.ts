/**
/// Notification item data model received from REST API or SignalR WebSocket.
*/
export interface NotificationItem {
  id: number;
  externalId: string;
  notificationId: number;
  templateCode: string;
  category: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  title: string;
  body: string;
  actionUrl?: string;
  dataPayload?: Record<string, any>;
  createdAtUtc: string;
  isRead: boolean;
  readAtUtc?: string;
  isArchived: boolean;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  totalCount: number;
  unreadCount: number;
  pageIndex: number;
  pageSize: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface NotificationPreference {
  id: number;
  category: string;
  channel: string;
  isEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}
