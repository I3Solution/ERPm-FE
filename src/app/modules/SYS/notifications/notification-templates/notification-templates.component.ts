import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import {
  NotificationTemplate,
  CreateNotificationTemplateRequest,
  UpdateNotificationTemplateRequest,
  PreviewNotificationTemplateResponse
} from '../../../../core/models/notification.model';
import { NotificationStateService } from '../../../../core/services/notification-state.service';
import { LocalizationService } from '../../../../core/services/localization.service';
import { ListAction, ListPageComponent } from '../../../../shared/components/list-page/list-page.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { FormControlComponent } from '../../../../shared/components/form-control/form-control.component';
import { DataTableComponent, TableColumnComponent } from '../../../../shared/components/data-table';

@Component({
  selector: 'app-notification-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe, FormControlComponent, DataTableComponent, TableColumnComponent, ListPageComponent],
  templateUrl: './notification-templates.component.html',
  styleUrls: ['./notification-templates.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationTemplatesComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private i18n = inject(LocalizationService);

  /** Header action bar of the shared list page: Add is the primary button, the way back to the center sits in the menu. */
  public readonly headerActions: ListAction[] = [
    { id: 'create', label: 'ntpl.add', icon: '+', primary: true },
    { id: 'back', label: 'notifications.back_to_center', icon: '←' }
  ];

  public onHeaderAction(id: string): void {
    if (id === 'create') this.openCreateModal();
    else if (id === 'back') void this.router.navigate(['/notifications']);
  }
  public notifState = inject(NotificationStateService);
  private baseUrl = `${environment.apiBaseUrl}/api/v1/sys/notification-templates`;

  public templates = signal<NotificationTemplate[]>([]);
  public isLoading = signal<boolean>(false);
  public isSaving = signal<boolean>(false);
  public isTesting = signal<boolean>(false);
  public toastMessage = signal<string | null>(null);

  // Filters
  public filterCategory = signal<string>('ALL');
  public filterStatus = signal<string>('ALL');
  public searchQuery = signal<string>('');

  // Modal / Drawer state
  public isDrawerOpen = signal<boolean>(false);
  public isEditing = signal<boolean>(false);
  public activeTab = signal<'vi' | 'en'>('vi');

  // Form Model
  public currentId = signal<number | null>(null);
  public formCode = signal<string>('');
  public formName = signal<string>('');
  public formCategory = signal<string>('SYS');
  public formSeverity = signal<'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER'>('INFO');
  public formActionUrl = signal<string>('');
  public formIsActive = signal<boolean>(true);
  public formIsDigest = signal<boolean>(false);
  public formDigestWindow = signal<number>(300);

  // Channels
  public channelInApp = signal<boolean>(true);
  public channelPush = signal<boolean>(false);
  public channelEmail = signal<boolean>(false);
  public channelSms = signal<boolean>(false);

  // Multilingual templates
  public formTitleVi = signal<string>('');
  public formBodyVi = signal<string>('');
  public formTitleEn = signal<string>('');
  public formBodyEn = signal<string>('');

  // Live preview rendered text
  public previewTitle = computed(() => {
    const lang = this.activeTab();
    return lang === 'en' && this.formTitleEn() ? this.interpolate(this.formTitleEn()) : this.interpolate(this.formTitleVi());
  });

  public previewBody = computed(() => {
    const lang = this.activeTab();
    return lang === 'en' && this.formBodyEn() ? this.interpolate(this.formBodyEn()) : this.interpolate(this.formBodyVi());
  });

  private t(key: string): string { return this.i18n.translate(key); }

  public get categories() {
    return ['ALL', 'SD', 'WMS', 'PUR', 'ACC', 'CRM', 'HRM', 'SYS'].map(code => ({ code, label: this.t('ntpl.cat_' + code.toLowerCase()) }));
  }

  public get severities(): Array<{ code: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER'; label: string }> {
    return (['INFO', 'SUCCESS', 'WARNING', 'DANGER'] as const).map(code => ({ code, label: this.t('ntpl.sev_' + code.toLowerCase()) }));
  }

  public get filterCategoryOptions() { return this.categories.map(c => ({ value: c.code, label: c.label })); }
  public get formCategoryOptions() { return this.categories.filter(c => c.code !== 'ALL').map(c => ({ value: c.code, label: c.label })); }
  public get severityOptions() { return this.severities.map(s => ({ value: s.code, label: s.label })); }
  public get statusFilterOptions() {
    return [
      { value: 'ALL', label: this.t('ntpl.status_all') },
      { value: 'ACTIVE', label: this.t('ntpl.status_active') },
      { value: 'INACTIVE', label: this.t('ntpl.status_inactive') }
    ];
  }

  public readonly sampleVariables: Record<string, string> = {
    order_code: 'SO-2026-0042',
    customer_name: 'Công ty Cổ phần Alpha',
    amount: '15,500,000 đ',
    item_code: 'SKU-LOGI-M331',
    item_name: 'Chuột không dây Silent',
    qty: '3',
    warehouse: 'Kho Tổng Hà Nội',
    user_name: 'Nguyễn Văn Quản Trị',
    reason: 'Hủy đơn theo yêu cầu khách hàng',
    time: '31/10/2026 14:30'
  };

  public filteredTemplates = computed(() => {
    const list = this.templates();
    const cat = this.filterCategory();
    const status = this.filterStatus();
    const q = this.searchQuery().trim().toLowerCase();

    return list.filter(item => {
      if (cat !== 'ALL' && item.category !== cat) return false;
      if (status === 'ACTIVE' && !item.isActive) return false;
      if (status === 'INACTIVE' && item.isActive) return false;
      if (q) {
        const matchCode = item.code?.toLowerCase().includes(q);
        const matchName = item.name?.toLowerCase().includes(q);
        const matchTitle = item.titleTemplate?.toLowerCase().includes(q);
        const matchBody = item.bodyTemplate?.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchTitle && !matchBody) return false;
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.loadTemplates();
  }

  public loadTemplates(): void {
    this.isLoading.set(true);
    this.http.get<{ data: NotificationTemplate[] }>(this.baseUrl).subscribe({
      next: res => {
        this.isLoading.set(false);
        if (res?.data) {
          this.templates.set(res.data);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.showToast(this.t('ntpl.toast_load_failed'));
      }
    });
  }

  public openCreateModal(): void {
    this.isEditing.set(false);
    this.currentId.set(null);
    this.formCode.set('');
    this.formName.set('');
    this.formCategory.set('SD');
    this.formSeverity.set('INFO');
    this.formActionUrl.set('');
    this.formIsActive.set(true);
    this.formIsDigest.set(false);
    this.formDigestWindow.set(300);

    this.channelInApp.set(true);
    this.channelPush.set(false);
    this.channelEmail.set(false);
    this.channelSms.set(false);

    this.formTitleVi.set('');
    this.formBodyVi.set('');
    this.formTitleEn.set('');
    this.formBodyEn.set('');

    this.activeTab.set('vi');
    this.isDrawerOpen.set(true);
  }

  public openEditModal(template: NotificationTemplate): void {
    this.isEditing.set(true);
    this.currentId.set(template.id);
    this.formCode.set(template.code);
    this.formName.set(template.name);
    this.formCategory.set(template.category);
    this.formSeverity.set(template.defaultSeverity);
    this.formActionUrl.set(template.actionUrlPattern || '');
    this.formIsActive.set(template.isActive);
    this.formIsDigest.set(template.isDigestAllowed);
    this.formDigestWindow.set(template.digestWindowSeconds || 300);

    const ch = template.supportedChannels || [];
    this.channelInApp.set(ch.includes('IN_APP'));
    this.channelPush.set(ch.includes('PUSH_MOBILE'));
    this.channelEmail.set(ch.includes('EMAIL'));
    this.channelSms.set(ch.includes('SMS'));

    const vi = template.translations?.['vi'] || { title: template.titleTemplate, body: template.bodyTemplate };
    const en = template.translations?.['en'] || { title: '', body: '' };

    this.formTitleVi.set(vi.title || template.titleTemplate);
    this.formBodyVi.set(vi.body || template.bodyTemplate);
    this.formTitleEn.set(en.title || '');
    this.formBodyEn.set(en.body || '');

    this.activeTab.set('vi');
    this.isDrawerOpen.set(true);
  }

  public closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  public insertPlaceholder(field: 'title' | 'body', variableKey: string): void {
    const token = `{${variableKey}}`;
    if (this.activeTab() === 'vi') {
      if (field === 'title') {
        this.formTitleVi.update(v => v + ' ' + token);
      } else {
        this.formBodyVi.update(v => v + ' ' + token);
      }
    } else {
      if (field === 'title') {
        this.formTitleEn.update(v => v + ' ' + token);
      } else {
        this.formBodyEn.update(v => v + ' ' + token);
      }
    }
  }

  public saveTemplate(): void {
    if (!this.formName().trim()) {
      this.showToast(this.t('ntpl.toast_name_required'));
      return;
    }

    if (!this.formTitleVi().trim() || !this.formBodyVi().trim()) {
      this.showToast(this.t('ntpl.toast_vi_required'));
      return;
    }

    const channels: string[] = [];
    if (this.channelInApp()) channels.push('IN_APP');
    if (this.channelPush()) channels.push('PUSH_MOBILE');
    if (this.channelEmail()) channels.push('EMAIL');
    if (this.channelSms()) channels.push('SMS');

    const translations: Record<string, { title: string; body: string }> = {
      vi: { title: this.formTitleVi().trim(), body: this.formBodyVi().trim() }
    };

    if (this.formTitleEn().trim() || this.formBodyEn().trim()) {
      translations['en'] = {
        title: this.formTitleEn().trim() || this.formTitleVi().trim(),
        body: this.formBodyEn().trim() || this.formBodyVi().trim()
      };
    }

    this.isSaving.set(true);

    if (this.isEditing() && this.currentId()) {
      const payload: UpdateNotificationTemplateRequest = {
        name: this.formName().trim(),
        category: this.formCategory(),
        defaultSeverity: this.formSeverity(),
        supportedChannels: channels,
        titleTemplate: this.formTitleVi().trim(),
        bodyTemplate: this.formBodyVi().trim(),
        translations,
        actionUrlPattern: this.formActionUrl().trim() || undefined,
        isDigestAllowed: this.formIsDigest(),
        digestWindowSeconds: this.formDigestWindow(),
        isActive: this.formIsActive()
      };

      this.http.put<{ data: NotificationTemplate }>(`${this.baseUrl}/${this.currentId()}`, payload).subscribe({
        next: res => {
          this.isSaving.set(false);
          this.showToast(this.t('ntpl.toast_updated'));
          this.closeDrawer();
          this.loadTemplates();
        },
        error: () => {
          this.isSaving.set(false);
          this.showToast(this.t('ntpl.toast_save_failed'));
        }
      });
    } else {
      if (!this.formCode().trim()) {
        this.showToast(this.t('ntpl.toast_code_required'));
        this.isSaving.set(false);
        return;
      }

      const payload: CreateNotificationTemplateRequest = {
        code: this.formCode().trim().toUpperCase(),
        name: this.formName().trim(),
        category: this.formCategory(),
        defaultSeverity: this.formSeverity(),
        supportedChannels: channels,
        titleTemplate: this.formTitleVi().trim(),
        bodyTemplate: this.formBodyVi().trim(),
        translations,
        actionUrlPattern: this.formActionUrl().trim() || undefined,
        isDigestAllowed: this.formIsDigest(),
        digestWindowSeconds: this.formDigestWindow(),
        isActive: this.formIsActive()
      };

      this.http.post<{ data: NotificationTemplate }>(this.baseUrl, payload).subscribe({
        next: res => {
          this.isSaving.set(false);
          this.showToast(this.t('ntpl.toast_created'));
          this.closeDrawer();
          this.loadTemplates();
        },
        error: err => {
          this.isSaving.set(false);
          this.showToast(err?.error?.message || this.t('ntpl.toast_create_failed'));
        }
      });
    }
  }

  public testSend(templateId?: number): void {
    const id = templateId || this.currentId();
    if (!id) {
      this.showToast(this.t('ntpl.toast_save_first'));
      return;
    }

    this.isTesting.set(true);
    const payload = { sampleData: this.sampleVariables };

    this.http.post<{ success: boolean; data: any }>(`${this.baseUrl}/${id}/test-send`, payload).subscribe({
      next: res => {
        this.isTesting.set(false);
        this.showToast(this.t('ntpl.toast_test_sent'));
        this.notifState.loadUnreadCount();
      },
      error: () => {
        this.isTesting.set(false);
        this.showToast(this.t('ntpl.toast_test_failed'));
      }
    });
  }

  public toggleActive(template: NotificationTemplate, event: Event): void {
    event.stopPropagation();
    const newStatus = !template.isActive;

    const payload: UpdateNotificationTemplateRequest = {
      name: template.name,
      category: template.category,
      defaultSeverity: template.defaultSeverity,
      supportedChannels: template.supportedChannels,
      titleTemplate: template.titleTemplate,
      bodyTemplate: template.bodyTemplate,
      translations: template.translations,
      actionUrlPattern: template.actionUrlPattern,
      isDigestAllowed: template.isDigestAllowed,
      digestWindowSeconds: template.digestWindowSeconds,
      isActive: newStatus
    };

    this.http.put(`${this.baseUrl}/${template.id}`, payload).subscribe({
      next: () => {
        this.templates.update(list =>
          list.map(t => (t.id === template.id ? { ...t, isActive: newStatus } : t))
        );
        this.showToast(this.t(newStatus ? 'ntpl.toast_activated' : 'ntpl.toast_paused'));
      },
      error: () => {
        this.showToast(this.t('ntpl.toast_status_failed'));
      }
    });
  }

  public getChipDisplay(key: any): string {
    return "+ {" + key + "}";
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

  private interpolate(pattern: string): string {
    if (!pattern) return '';
    return pattern.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
      return this.sampleVariables[key] || `{${key}}`;
    });
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3500);
  }
}
