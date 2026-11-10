import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { FormControlComponent } from '../../shared/components/form-control/form-control.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
@Component({ selector: 'app-login', standalone: true, imports: [CommonModule, ReactiveFormsModule, FormControlComponent, TranslatePipe], templateUrl: './login.component.html', styleUrls: ['./login.component.scss'], changeDetection: ChangeDetectionStrategy.OnPush })
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public submitting = signal(false);
  public form = inject(FormBuilder).nonNullable.group({ userName: ['', Validators.required], password: ['', Validators.required] });
  submit(): void {
    if (this.form.invalid || this.submitting()) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    const value = this.form.getRawValue();
    this.auth.login(value.userName, value.password).pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: () => {
        this.form.reset();
        const rawReturnUrl = this.route.snapshot.queryParams['returnUrl'];
        const returnUrl = (typeof rawReturnUrl === 'string' && rawReturnUrl.startsWith('/') && !rawReturnUrl.startsWith('/login'))
          ? rawReturnUrl
          : '/dashboard';
        void this.router.navigateByUrl(returnUrl);
      },
      error: () => {}
    });
  }
}
