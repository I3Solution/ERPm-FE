import { Routes } from '@angular/router';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { ItemsComponent } from './modules/WMS/items.component';
import { PosComponent } from './modules/SD/pos.component';
import { InventoryComponent } from './modules/WMS/inventory.component';
import { PartnersComponent } from './modules/CRM/partners.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'catalog', component: ItemsComponent },
  { path: 'sales', component: PosComponent },
  { path: 'inventory', component: InventoryComponent },
  { path: 'partners', component: PartnersComponent },
  { path: '**', redirectTo: 'dashboard' }
];
