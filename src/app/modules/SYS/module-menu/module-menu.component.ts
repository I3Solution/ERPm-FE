import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModuleNavigationComponent } from '../../../shared/components/module-navigation/module-navigation.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-module-menu',
  standalone: true,
  imports: [ModuleNavigationComponent, TranslatePipe],
  templateUrl: './module-menu.component.html',
  styleUrl: './module-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModuleMenuComponent {}
