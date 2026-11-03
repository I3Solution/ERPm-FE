import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { OrgBranch } from '../../../../../core/models/org.models';
import { BranchSelectComponent } from '../../../../../shared/components/branch-select/branch-select.component';
import { SelectOption } from '../../../../../shared/components/custom-select/custom-select.component';
import { FormControlComponent } from '../../../../../shared/components/form-control/form-control.component';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';

/**
 * Data range of a role ("whose data is visible"): the range mode, whether it includes descendants, and the
 * organization units of the CUSTOM_BRANCHES range. The two form controls belong to the role form of the parent.
 */
@Component({
  selector: 'app-data-scope',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, FormControlComponent, BranchSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-scope.component.html',
  styleUrls: ['./data-scope.component.scss']
})
export class DataScopeComponent {
  public modeControl = input.required<FormControl<string>>();
  public descendantsControl = input.required<FormControl<boolean>>();
  public options = input.required<SelectOption[]>();
  public showCustomBranches = input(false);
  public branchIds = input<number[]>([]);
  public branchTree = input<OrgBranch[]>([]);
  public error = input<string | null>(null);
  public readOnly = input(false);
  public branchIdsChange = output<number[]>();

  public add(id: number | null): void {
    if (id == null || this.branchIds().includes(id)) return;
    this.branchIdsChange.emit([...this.branchIds(), id]);
  }

  public remove(id: number): void { this.branchIdsChange.emit(this.branchIds().filter(b => b !== id)); }

  public branchName(id: number): string { return this.findBranch(this.branchTree(), id)?.name ?? String(id); }

  private findBranch(nodes: OrgBranch[], id: number): OrgBranch | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = this.findBranch(node.children ?? [], id);
      if (found) return found;
    }
    return null;
  }
}
