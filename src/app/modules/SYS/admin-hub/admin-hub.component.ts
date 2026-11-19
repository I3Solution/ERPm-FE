import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

/**
 * Representation of a single administration navigation item.
 */
export interface AdminHubItem {
  id: string;
  icon: string;
  titleKey: string;
  descKey: string;
  route: string;
  permission: string;
}

/**
 * Group of administration items organized by business area.
 */
export interface AdminHubSection {
  titleKey: string;
  items: AdminHubItem[];
}

@Component({
  selector: 'app-admin-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './admin-hub.component.html',
  styleUrls: ['./admin-hub.component.scss']
})
export class AdminHubComponent {
  public auth = inject(AuthService);

  /**
   * Configured administration sections and their associated modules.
   */
  public readonly sections: AdminHubSection[] = [
    {
      titleKey: 'admin_hub.section_org',
      items: [
        {
          id: 'org',
          icon: '🏢',
          titleKey: 'menu.org',
          descKey: 'admin_hub.org_desc',
          route: '/org',
          permission: 'hrm:department:view'
        },
        {
          id: 'department-levels',
          icon: '📑',
          titleKey: 'menu.department_levels',
          descKey: 'admin_hub.department_levels_desc',
          route: '/department-levels',
          permission: 'hrm:department:view'
        },
        {
          id: 'job-positions',
          icon: '🎖️',
          titleKey: 'menu.job_positions',
          descKey: 'admin_hub.job_positions_desc',
          route: '/job-positions',
          permission: 'hrm:job-position:view'
        },
        {
          id: 'employees',
          icon: '🧑‍💼',
          titleKey: 'menu.employees',
          descKey: 'admin_hub.employees_desc',
          route: '/employees',
          permission: 'hrm:employee:view'
        }
      ]
    },
    {
      titleKey: 'admin_hub.section_security',
      items: [
        {
          id: 'users',
          icon: '🔑',
          titleKey: 'menu.users',
          descKey: 'admin_hub.users_desc',
          route: '/users',
          permission: 'sys:user:view'
        },
        {
          id: 'roles',
          icon: '🛡️',
          titleKey: 'menu.roles',
          descKey: 'admin_hub.roles_desc',
          route: '/roles',
          permission: 'sys:role:view'
        },
        {
          id: 'notification-templates',
          icon: '📝',
          titleKey: 'menu.notification_templates',
          descKey: 'admin_hub.notification_templates_desc',
          route: '/notifications/templates',
          permission: 'sys:notification:view'
        }
      ]
    }
  ];

  /**
   * Determines whether the given section contains at least one item visible to the current user.
   */
  public hasVisibleItems(section: AdminHubSection): boolean {
    return section.items.some(item => this.auth.can(item.permission));
  }

  /**
   * Returns true when the current user has access to at least one administration item.
   */
  public get hasAnyVisibleItem(): boolean {
    return this.sections.some(section => this.hasVisibleItems(section));
  }
}
