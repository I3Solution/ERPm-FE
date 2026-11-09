import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { NavigationHistoryService } from '../../../core/services/navigation-history.service';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './back-button.component.html',
  styleUrls: ['./back-button.component.scss']
})
export class BackButtonComponent {
  private navHistory = inject(NavigationHistoryService);

  @Input() defaultUrl = '/';
  @Input() label = 'common.back';
  @Input() showLabel = true;
  @Input() customClass = '';

  public onBack(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.navHistory.back(this.defaultUrl);
  }
}

