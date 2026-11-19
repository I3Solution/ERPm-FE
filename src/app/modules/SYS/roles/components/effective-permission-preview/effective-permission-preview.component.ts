import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocalizationService } from '../../../../../core/services/localization.service';
import { EffectivePermission } from '../../../../../core/models/org.models';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';

/** What one account may actually do, grouped by module, with the role or statement that grants or denies each action. */
@Component({
  selector: 'app-effective-permission-preview',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './effective-permission-preview.component.html',
  styleUrls: ['./effective-permission-preview.component.scss']
})
export class EffectivePermissionPreviewComponent {
  private i18n = inject(LocalizationService);

  public rows = input.required<EffectivePermission[]>();
  /** Owned by the parent (two-way) so the choice survives while another account is loading. */
  public filter = model<'all' | 'Allowed' | 'Denied'>('all');

  /** Effective rows grouped by module, optionally limited to allowed or denied actions. */
  public groups = computed(() => {
    const filter = this.filter();
    const rows = this.rows().filter(row => filter === 'all' || row.status === filter);
    const groups = new Map<string, EffectivePermission[]>();
    for (const row of rows) groups.set(row.module, [...(groups.get(row.module) ?? []), row]);
    return [...groups].map(([module, items]) => ({ module, items }));
  });
  public counts = computed(() => {
    const rows = this.rows();
    return { allowed: rows.filter(r => r.status === 'Allowed').length, denied: rows.filter(r => r.status === 'Denied').length };
  });

  /** Human readable origin of a matched statement, e.g. "Position role: SALES_ACCOUNTANT". */
  public sourceLabel(source: string): string {
    const [kind, code] = source.split(':');
    const label = this.i18n.translate('role.source.' + kind);
    return code ? `${label}: ${code}` : label;
  }
}
