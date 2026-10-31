import { authGuard } from './core/auth.guard';
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./core/login/login.component').then(m => m.LoginComponent) },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'catalog', loadComponent: () => import('./modules/WMS/items.component').then(m => m.ItemsComponent), canActivate: [authGuard] },
  { path: 'sales', loadComponent: () => import('./modules/SD/pos.component').then(m => m.PosComponent), canActivate: [authGuard] },
  { path: 'inventory', loadComponent: () => import('./modules/WMS/inventory.component').then(m => m.InventoryComponent), canActivate: [authGuard] },
  { path: 'partners', loadComponent: () => import('./modules/CRM/partners.component').then(m => m.PartnersComponent), canActivate: [authGuard] },
  { path: 'notifications', loadComponent: () => import('./modules/SYS/notifications/notifications.component').then(m => m.NotificationsComponent), canActivate: [authGuard] },
  { path: 'notifications/preferences', loadComponent: () => import('./modules/SYS/notifications/notification-preferences.component').then(m => m.NotificationPreferencesComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: 'dashboard' }
];
