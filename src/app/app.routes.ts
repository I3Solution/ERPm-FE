import { authGuard } from './core/auth.guard';
import { permissionGuard } from './core/permission.guard';
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./core/login/login.component').then(m => m.LoginComponent) },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [permissionGuard('dashboard:metrics:view')] },
  { path: 'catalog', loadComponent: () => import('./modules/WMS/items.component').then(m => m.ItemsComponent), canActivate: [permissionGuard('wms:item:view')] },
  { path: 'sales', loadComponent: () => import('./modules/SD/pos.component').then(m => m.PosComponent), canActivate: [permissionGuard('sd:invoice:view')] },
  { path: 'inventory', loadComponent: () => import('./modules/WMS/inventory.component').then(m => m.InventoryComponent), canActivate: [permissionGuard('wms:stock:view')] },
  { path: 'partners', loadComponent: () => import('./modules/CRM/partners.component').then(m => m.PartnersComponent), canActivate: [permissionGuard('crm:partner:view')] },
  { path: 'org', loadComponent: () => import('./modules/HRM/org-tree.component').then(m => m.OrgTreeComponent), canActivate: [permissionGuard('hrm:department:view')] },
  { path: 'job-positions', loadComponent: () => import('./modules/HRM/job-positions.component').then(m => m.JobPositionsComponent), canActivate: [permissionGuard('hrm:job-position:view')] },
  { path: 'employees', loadComponent: () => import('./modules/HRM/employees.component').then(m => m.EmployeesComponent), canActivate: [permissionGuard('hrm:employee:view')] },
  { path: 'users', loadComponent: () => import('./modules/SYS/users/users.component').then(m => m.UsersComponent), canActivate: [permissionGuard('sys:user:view')] },
  { path: 'notifications', loadComponent: () => import('./modules/SYS/notifications/notifications.component').then(m => m.NotificationsComponent), canActivate: [authGuard] },
  { path: 'notifications/preferences', loadComponent: () => import('./modules/SYS/notifications/notification-preferences.component').then(m => m.NotificationPreferencesComponent), canActivate: [authGuard] },
  { path: 'forbidden', loadComponent: () => import('./core/forbidden/forbidden.component').then(m => m.ForbiddenComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: 'dashboard' }
];
