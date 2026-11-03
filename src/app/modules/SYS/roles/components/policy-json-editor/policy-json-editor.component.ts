import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormControlComponent } from '../../../../../shared/components/form-control/form-control.component';

/**
 * Raw policy JSON text box shared by the role designer (rules the matrix cannot express) and the inline policy of an
 * account. It only shows the text and the error; parsing and validation stay with the owner of the control.
 */
@Component({
  selector: 'app-policy-json-editor',
  standalone: true,
  imports: [ReactiveFormsModule, FormControlComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './policy-json-editor.component.html',
  styleUrls: ['./policy-json-editor.component.scss']
})
export class PolicyJsonEditorComponent {
  public control = input.required<FormControl<string>>();
  public rows = input(18);
  public label = input('');
  public hint = input<string | undefined>(undefined);
  public error = input<string | null>(null);
  /** Also repeat the error as an alert under the box (the role designer does, the account form does not). */
  public alert = input(false);
}
