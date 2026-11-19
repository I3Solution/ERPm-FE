import { ChangeDetectionStrategy, Component, computed, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { IsActiveMatchOptions, NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NavigationPreferenceService } from '../../../core/services/navigation-preference.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TreeKey, TreeNode, TreeViewComponent } from '../tree-view/tree-view.component';

interface NavigationEntry {
  icon: string;
  route?: string;
  permission?: string;
  exact?: boolean;
}

type NavigationNode = TreeNode<NavigationEntry>;

function link(route: string, label: string, icon: string, permission?: string, exact = false): NavigationNode {
  return { id: route, label, data: { route, icon, permission, exact } };
}

function group(id: string, label: string, icon: string, children: NavigationNode[]): NavigationNode {
  return { id, label, data: { icon }, children };
}

const MODULES: NavigationNode[] = [
  link('/dashboard', 'menu.dashboard', '📊', 'dashboard:metrics:view'),
  link('/notifications', 'menu.notifications', '🔔', undefined, true),
  group('sales', 'menu.sales_module', '🛒', [
    link('/sales', 'menu.sales_pos', '🛒', 'sd:invoice:view', true),
    link('/sales/orders', 'menu.orders', '📦', 'sd:order:view'),
    link('/sales/quotations', 'menu.quotations', '📝', 'sd:quotation:view'),
    link('/sales/price-lists', 'menu.price_lists', '🏷️', 'sd:pricelist:view'),
    link('/sales/returns', 'menu.returns', '↩️', 'sd:return:view'),
    link('/sales/analytics', 'menu.sales_analytics', '📈', 'sd:report:view')
  ]),
  group('warehouse', 'menu.warehouse_module', '📦', [
    link('/catalog', 'menu.catalog', '🏷️', 'wms:item:view'),
    link('/inventory', 'menu.inventory', '📦', 'wms:stock:view')
  ]),
  link('/partners', 'menu.partners', '👥', 'crm:partner:view'),
  group('accounting', 'menu.accounting', '🧮', [
    link('/accounting/chart-of-accounts', 'menu.acc_accounts', '📖', 'acc:account:view'),
    link('/accounting/treasury', 'menu.acc_treasury', '💰', 'acc:treasury:view'),
    link('/accounting/posting-profiles', 'menu.acc_posting_profiles', '🧮', 'acc:posting-profile:view'),
    link('/accounting/receipt-vouchers', 'menu.acc_receipts', '💵', 'acc:receipt-voucher:view'),
    link('/accounting/payment-vouchers', 'menu.acc_payments', '💸', 'acc:payment-voucher:view')
  ]),
  group('hr', 'menu.hr_module', '🏢', [
    link('/org', 'menu.org', '🏢', 'hrm:department:view'),
    link('/department-levels', 'menu.department_levels', '🗂️', 'hrm:department:view'),
    link('/job-positions', 'menu.job_positions', '🎖️', 'hrm:job-position:view'),
    link('/employees', 'menu.employees', '🧑‍💼', 'hrm:employee:view')
  ]),
  group('admin', 'menu.admin', '⚙️', [
    link('/users', 'menu.users', '🔑', 'sys:user:view'),
    link('/roles', 'menu.roles', '🛡️', 'sys:role:view'),
    link('/notifications/templates', 'menu.notification_templates', '📝', 'sys:notification:view')
  ])
];

export const MODULE_NAVIGATION_GROUP_IDS: ReadonlySet<string> = new Set(
  MODULES.filter(node => !!node.children?.length).map(node => String(node.id))
);

@Component({
  selector: 'app-module-navigation',
  standalone: true,
  imports: [TreeViewComponent, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './module-navigation.component.html',
  styleUrl: './module-navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModuleNavigationComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly navPreferences = inject(NavigationPreferenceService);
  private readonly routeChange = toSignal(this.router.events.pipe(filter(event => event instanceof NavigationEnd)));

  public readonly exactPath: IsActiveMatchOptions = { paths: 'exact', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored' };
  public readonly nestedPath: IsActiveMatchOptions = { ...this.exactPath, paths: 'subset' };
  public readonly nodes = computed(() => MODULES.flatMap(node => {
    if (!node.children) return this.canShow(node) ? [node] : [];
    const children = node.children.filter(child => this.canShow(child));
    return children.length ? [{ ...node, children }] : [];
  }));

  private readonly visibleGroupIds = computed<ReadonlySet<string>>(() => new Set(
    this.nodes().filter(node => !!node.children?.length).map(node => String(node.id))
  ));

  public readonly activeGroup = computed<string | undefined>(() => {
    this.routeChange();
    const id = this.nodes().find(node => node.children?.some(child =>
      this.router.isActive(child.data.route!, child.data.exact ? this.exactPath : this.nestedPath)
    ))?.id;
    return id === undefined ? undefined : String(id);
  });

  private readonly syncActiveGroupEffect = effect(() => {
    const active = this.activeGroup();
    this.auth.account();
    untracked(() => this.navPreferences.syncActiveGroup(active));
  });

  /**
   * Displayed expanded group IDs: intersection of persisted manual choices with currently
   * permitted visible groups, plus ephemeral expansion of the active route group unless
   * collapsed during the current visit.
   */
  public readonly expanded = computed<ReadonlySet<TreeKey>>(() => {
    const visible = this.visibleGroupIds();
    const result = new Set<TreeKey>();
    for (const id of this.navPreferences.expandedGroups()) {
      if (visible.has(id)) {
        result.add(id);
      }
    }
    const active = this.activeGroup();
    if (active && visible.has(active) && !this.navPreferences.isActiveGroupSuppressed(active)) {
      result.add(active);
    }
    return result;
  });

  public onExpandedChange(next: ReadonlySet<TreeKey>): void {
    const current = this.expanded();
    const active = this.activeGroup();
    for (const key of next) {
      if (!current.has(key)) {
        this.navPreferences.setGroupExpanded(String(key), true, MODULE_NAVIGATION_GROUP_IDS, active);
      }
    }
    for (const key of current) {
      if (!next.has(key)) {
        this.navPreferences.setGroupExpanded(String(key), false, MODULE_NAVIGATION_GROUP_IDS, active);
      }
    }
  }

  private canShow(node: NavigationNode): boolean {
    return !node.data.permission || this.auth.can(node.data.permission);
  }
}
