import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Role, UserAccessPolicy } from '../../../../../core/models/org.models';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { PolicyJsonEditorComponent } from '../policy-json-editor/policy-json-editor.component';

/** Extra roles and the inline policy of one account. The owner holds the data and does the saving. */
@Component({
  selector: 'app-user-role-assignment',
  standalone: true,
  imports: [TranslatePipe, PolicyJsonEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-role-assignment.component.html',
  styleUrls: ['./user-role-assignment.component.scss']
})
export class UserRoleAssignmentComponent {
  public roles = input.required<Role[]>();
  public access = input.required<UserAccessPolicy>();
  public inlineControl = input.required<FormControl<string>>();
  public inlineError = input<string | null>(null);
  public saving = input(false);
  public canEdit = input(false);
  public roleToggle = output<number>();
  public save = output<void>();

  public hasExtraRole(roleId: number): boolean { return this.access().roles.some(r => r.roleId === roleId); }
}
