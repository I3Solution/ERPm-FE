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

export interface NotificationTemplateTranslation {
  title: string;
  body: string;
}

export interface NotificationTemplate {
  id: number;
  externalId: string;
  code: string;
  name: string;
  category: string;
  defaultSeverity: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  supportedChannels: string[];
  titleTemplate: string;
  bodyTemplate: string;
  translations: Record<string, NotificationTemplateTranslation>;
  actionUrlPattern?: string;
  isDigestAllowed: boolean;
  digestWindowSeconds: number;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string;
}

export interface CreateNotificationTemplateRequest {
  code: string;
  name: string;
  category: string;
  defaultSeverity: string;
  supportedChannels: string[];
  titleTemplate: string;
  bodyTemplate: string;
  translations: Record<string, NotificationTemplateTranslation>;
  actionUrlPattern?: string;
  isDigestAllowed: boolean;
  digestWindowSeconds: number;
  isActive: boolean;
}

export interface UpdateNotificationTemplateRequest {
  name: string;
  category: string;
  defaultSeverity: string;
  supportedChannels: string[];
  titleTemplate: string;
  bodyTemplate: string;
  translations: Record<string, NotificationTemplateTranslation>;
  actionUrlPattern?: string;
  isDigestAllowed: boolean;
  digestWindowSeconds: number;
  isActive: boolean;
}

export interface PreviewNotificationTemplateRequest {
  titleTemplate: string;
  bodyTemplate: string;
  translations: Record<string, NotificationTemplateTranslation>;
  sampleData: Record<string, any>;
}

export interface PreviewNotificationTemplateResponse {
  renderedTitleDefault: string;
  renderedBodyDefault: string;
  renderedTranslations: Record<string, NotificationTemplateTranslation>;
}
