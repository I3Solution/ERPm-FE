import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './back-button.component.html',
  styleUrls: ['./back-button.component.scss']
})
export class BackButtonComponent {
  private location = inject(Location);
  private router = inject(Router);

  @Input() defaultUrl = '/';
  @Input() label = 'common.back';
  @Input() showLabel = true;
  @Input() customClass = '';

  public onBack(event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    if (window.history.length > 1) {
      this.location.back();
    } else if (this.defaultUrl) {
      this.router.navigateByUrl(this.defaultUrl);
    }
  }
}

