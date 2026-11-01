import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import {
  NotificationTemplate,
  CreateNotificationTemplateRequest,
  UpdateNotificationTemplateRequest,
  PreviewNotificationTemplateResponse
} from '../../../../core/models/notification.model';
import { NotificationStateService } from '../../../../core/services/notification-state.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-notification-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './notification-templates.component.html',
  styleUrls: ['./notification-templates.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationTemplatesComponent implements OnInit {
  private http = inject(HttpClient);
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

  public readonly categories = [
    { code: 'ALL', label: 'Tất cả phân hệ' },
    { code: 'SD', label: '🛒 Bán hàng & POS (SD)' },
    { code: 'WMS', label: '📦 Kho hàng & Tồn kho (WMS)' },
    { code: 'PUR', label: '📥 Mua hàng (PUR)' },
    { code: 'ACC', label: '💰 Kế toán (ACC)' },
    { code: 'CRM', label: '👥 Khách hàng (CRM)' },
    { code: 'HRM', label: '👤 Nhân sự & IAM (HRM)' },
    { code: 'SYS', label: '⚙️ Hệ thống chung (SYS)' }
  ];

  public readonly severities: Array<{ code: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER'; label: string }> = [
    { code: 'INFO', label: 'ℹ️ Thông tin (INFO)' },
    { code: 'SUCCESS', label: '✓ Thành công (SUCCESS)' },
    { code: 'WARNING', label: '⚠️ Cảnh báo (WARNING)' },
    { code: 'DANGER', label: '🚨 Khẩn cấp (DANGER)' }
  ];

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
        this.showToast('Không thể tải danh sách mẫu thông báo');
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
      this.showToast('Vui lòng nhập tên gợi nhớ cho mẫu');
      return;
    }

    if (!this.formTitleVi().trim() || !this.formBodyVi().trim()) {
      this.showToast('Vui lòng nhập tiêu đề và nội dung tiếng Việt');
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
          this.showToast('Cập nhật mẫu thông báo thành công!');
          this.closeDrawer();
          this.loadTemplates();
        },
        error: () => {
          this.isSaving.set(false);
          this.showToast('Lỗi khi lưu mẫu thông báo');
        }
      });
    } else {
      if (!this.formCode().trim()) {
        this.showToast('Vui lòng nhập mã định danh mẫu (Code)');
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
          this.showToast('Thêm mới mẫu thông báo thành công!');
          this.closeDrawer();
          this.loadTemplates();
        },
        error: err => {
          this.isSaving.set(false);
          this.showToast(err?.error?.message || 'Lỗi khi tạo mới mẫu thông báo');
        }
      });
    }
  }

  public testSend(templateId?: number): void {
    const id = templateId || this.currentId();
    if (!id) {
      this.showToast('Hãy lưu mẫu trước khi thử nghiệm');
      return;
    }

    this.isTesting.set(true);
    const payload = { sampleData: this.sampleVariables };

    this.http.post<{ success: boolean; data: any }>(`${this.baseUrl}/${id}/test-send`, payload).subscribe({
      next: res => {
        this.isTesting.set(false);
        this.showToast('🔔 Đã bắn thông báo thử nghiệm! Hãy kiểm tra quả chuông và khay Toast.');
        this.notifState.loadUnreadCount();
      },
      error: () => {
        this.isTesting.set(false);
        this.showToast('Không thể gửi thông báo thử');
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
        this.showToast(newStatus ? 'Đã kích hoạt mẫu thông báo' : 'Đã tạm dừng mẫu thông báo');
      },
      error: () => {
        this.showToast('Lỗi khi cập nhật trạng thái');
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
