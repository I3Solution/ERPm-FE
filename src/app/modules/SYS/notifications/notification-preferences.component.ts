import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { NotificationPreference } from '../../../core/models/notification.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './notification-preferences.component.html',
  styleUrls: ['./notification-preferences.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationPreferencesComponent implements OnInit {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/api/v1/sys/notifications/preferences`;

  public preferences = signal<NotificationPreference[]>([]);
  public isLoading = signal<boolean>(false);
  public isSavedToastVisible = signal<boolean>(false);

  public quietHoursEnabled = signal<boolean>(false);
  public quietStart = signal<string>('22:00');
  public quietEnd = signal<string>('07:00');

  public readonly modules = [
    { code: 'SD', name: 'Bán hàng & POS (SD)', icon: '🛒' },
    { code: 'WMS', name: 'Kho & Tồn kho (WMS)', icon: '📦' },
    { code: 'PUR', name: 'Mua hàng & NCC (PUR)', icon: '📥' },
    { code: 'ACC', name: 'Kế toán & Sổ quỹ (ACC)', icon: '💰' },
    { code: 'CRM', name: 'Khách hàng (CRM)', icon: '👥' },
    { code: 'HRM', name: 'Nhân sự & Phân quyền (HRM)', icon: '👤' },
    { code: 'SYS', name: 'Hệ thống chung (SYS)', icon: '⚙️' }
  ];

  public readonly channels = [
    { code: 'IN_APP', name: 'Chuông In-App' },
    { code: 'PUSH_MOBILE', name: 'Mobile Push' },
    { code: 'EMAIL', name: 'Email' }
  ];

  ngOnInit(): void {
    this.loadPreferences();
  }

  public loadPreferences(): void {
    this.isLoading.set(true);
    this.http.get<{ data: NotificationPreference[] }>(this.baseUrl).subscribe({
      next: res => {
        this.isLoading.set(false);
        if (res?.data) {
          this.preferences.set(res.data);
          const firstWithQuiet = res.data.find(p => p.quietHoursStart && p.quietHoursEnd);
          if (firstWithQuiet) {
            this.quietHoursEnabled.set(true);
            this.quietStart.set(firstWithQuiet.quietHoursStart!.slice(0, 5));
            this.quietEnd.set(firstWithQuiet.quietHoursEnd!.slice(0, 5));
          }
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  public isChannelEnabled(moduleCode: string, channelCode: string): boolean {
    const pref = this.preferences().find(
      p => (p.category === moduleCode || p.category === 'ALL') && p.channel === channelCode
    );
    return pref ? pref.isEnabled : true;
  }

  public toggleChannel(moduleCode: string, channelCode: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const isEnabled = checkbox.checked;

    const payload = {
      category: moduleCode,
      channel: channelCode,
      isEnabled,
      quietHoursStart: this.quietHoursEnabled() ? `${this.quietStart()}:00` : null,
      quietHoursEnd: this.quietHoursEnabled() ? `${this.quietEnd()}:00` : null
    };

    this.http.put(this.baseUrl, payload).subscribe({
      next: () => {
        this.showSavedToast();
        this.preferences.update(list => {
          const index = list.findIndex(p => p.category === moduleCode && p.channel === channelCode);
          if (index >= 0) {
            const updated = [...list];
            updated[index] = { ...updated[index], isEnabled };
            return updated;
          }
          return [...list, { id: 0, category: moduleCode, channel: channelCode, isEnabled }];
        });
      }
    });
  }

  public saveQuietHours(): void {
    const payload = {
      category: 'ALL',
      channel: 'IN_APP',
      isEnabled: true,
      quietHoursStart: this.quietHoursEnabled() ? `${this.quietStart()}:00` : null,
      quietHoursEnd: this.quietHoursEnabled() ? `${this.quietEnd()}:00` : null
    };

    this.http.put(this.baseUrl, payload).subscribe({
      next: () => {
        this.showSavedToast();
      }
    });
  }

  private showSavedToast(): void {
    this.isSavedToastVisible.set(true);
    setTimeout(() => {
      this.isSavedToastVisible.set(false);
    }, 2500);
  }
}
