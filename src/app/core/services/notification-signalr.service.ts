import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { NotificationItem } from '../models/notification.model';

/**
 * Manages SignalR WebSocket connection lifecycle and event routing for notifications.
 */
@Injectable({ providedIn: 'root' })
export class NotificationSignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  private isConnecting = false;

  private onNotificationReceivedHandlers: ((item: NotificationItem) => void)[] = [];
  private onReadSyncHandlers: ((data: { recipientId: number }) => void)[] = [];
  private onAllReadSyncHandlers: (() => void)[] = [];

  public startConnection(): void {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected || this.isConnecting) {
      return;
    }

    const token = sessionStorage.getItem('erpm_access_token');
    if (!token) return;

    this.isConnecting = true;
    const hubUrl = `${environment.apiBaseUrl}/hubs/notifications`;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => sessionStorage.getItem('erpm_access_token') || '',
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.registerHandlers();

    this.hubConnection
      .start()
      .then(() => {
        this.isConnecting = false;
      })
      .catch(() => {
        this.isConnecting = false;
      });
  }

  public stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
    }
  }

  public onNotificationReceived(handler: (item: NotificationItem) => void): () => void {
    this.onNotificationReceivedHandlers.push(handler);
    return () => {
      this.onNotificationReceivedHandlers = this.onNotificationReceivedHandlers.filter(h => h !== handler);
    };
  }

  public onReadSync(handler: (data: { recipientId: number }) => void): () => void {
    this.onReadSyncHandlers.push(handler);
    return () => {
      this.onReadSyncHandlers = this.onReadSyncHandlers.filter(h => h !== handler);
    };
  }

  public onAllReadSync(handler: () => void): () => void {
    this.onAllReadSyncHandlers.push(handler);
    return () => {
      this.onAllReadSyncHandlers = this.onAllReadSyncHandlers.filter(h => h !== handler);
    };
  }

  private registerHandlers(): void {
    if (!this.hubConnection) return;

    this.hubConnection.on('ReceiveNotification', (item: NotificationItem) => {
      for (const handler of this.onNotificationReceivedHandlers) {
        handler(item);
      }
    });

    this.hubConnection.on('NotificationReadSync', (data: { recipientId: number }) => {
      for (const handler of this.onReadSyncHandlers) {
        handler(data);
      }
    });

    this.hubConnection.on('NotificationAllReadSync', () => {
      for (const handler of this.onAllReadSyncHandlers) {
        handler();
      }
    });
  }
}
