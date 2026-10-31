import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { OrgAdminService } from '../../../core/services/org-admin.service';
import { OrgBranch, UserAccount } from '../../../core/models/org.models';
import { FormControlComponent } from '../../../shared/components/form-control/form-control.component';
import { UserFormDialogComponent } from '../../../shared/components/user-form-dialog/user-form-dialog.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

/**
 * Internal accounts. A company administrator only receives the accounts of its own company's employees (the
 * server filters); each account shows the employee it is linked to. Create and edit use the shared account dialog.
 */
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, FormControlComponent, UserFormDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  public auth = inject(AuthService);
  private api = inject(OrgAdminService);

  public users = signal<UserAccount[]>([]);
  public branchTree = signal<OrgBranch[]>([]);
  public loading = signal(false);
  public keyword = signal('');
  public keywordControl = new FormControl('');

  /** Dialog target: `undefined` closed, `null` create, an account to edit. */
  public dialogUser = signal<UserAccount | null | undefined>(undefined);

  public isSuperAdmin = computed(() => !!this.auth.account()?.isSuperAdmin);

  public rows = computed(() => {
    const keyword = this.keyword().trim().toLowerCase();
    return this.users()
      .filter(u => !keyword || [u.userName, u.displayName, u.employeeCode ?? '', u.employeeName ?? ''].some(text => text.toLowerCase().includes(keyword)))
      .map(u => ({ ...u, employeeLabel: u.employeeId ? `${u.employeeCode} - ${u.employeeName}` : '' }));
  });

  constructor() {
    this.keywordControl.valueChanges.subscribe(text => this.keyword.set(text ?? ''));
  }

  ngOnInit(): void {
    this.load();
    this.api.branchTree().subscribe(tree => this.branchTree.set(tree));
  }

  public load(): void {
    this.loading.set(true);
    this.api.users().subscribe({
      next: users => { this.users.set(users); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  public openCreate(): void { this.dialogUser.set(null); }
  public openEdit(user: UserAccount): void { this.dialogUser.set(user); }
  public closeDialog(): void { this.dialogUser.set(undefined); }
  public onSaved(): void { this.closeDialog(); this.load(); }
}
