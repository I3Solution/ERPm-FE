import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PermissionCatalogItem } from '../../../../../core/models/org.models';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { MatrixModel, groupCatalog } from '../../policy-matrix.util';

/**
 * Module-grouped permission matrix ("what can be done"): one Allow tick and one Deny tick per catalog action.
 * Purely presentational: it never mutates the model it is given, it emits the next one.
 */
@Component({
  selector: 'app-permission-matrix',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './permission-matrix.component.html',
  styleUrls: ['./permission-matrix.component.scss']
})
export class PermissionMatrixComponent {
  public catalog = input.required<PermissionCatalogItem[]>();
  public matrix = input.required<MatrixModel>();
  public readOnly = input(false);
  /** Changes whenever the parent opens another role, so every module folds back. */
  public resetKey = input(0);
  public matrixChange = output<MatrixModel>();

  public expanded = signal<ReadonlySet<string>>(new Set());
  public modules = computed(() => groupCatalog(this.catalog()));

  constructor() {
    effect(() => {
      this.resetKey();
      untracked(() => this.expanded.set(new Set()));
    });
  }

  public isOpen(module: string): boolean { return this.expanded().has(module); }

  public toggleModule(module: string): void {
    const next = new Set(this.expanded());
    next.has(module) ? next.delete(module) : next.add(module);
    this.expanded.set(next);
  }

  public expandAll(open: boolean): void { this.expanded.set(open ? new Set(this.modules().map(m => m.module)) : new Set()); }

  public isAllowed(action: string): boolean { return this.matrix().allow.has(action); }
  public isDenied(action: string): boolean { return this.matrix().deny.has(action); }

  /** Ticking an action allows it; a denied action is cleared first so one action never sits in both sets. */
  public toggleAllow(action: string): void {
    if (this.readOnly()) return;
    const model = this.matrix();
    const allow = new Set(model.allow);
    const deny = new Set(model.deny);
    allow.has(action) ? allow.delete(action) : (allow.add(action), deny.delete(action));
    this.matrixChange.emit({ ...model, allow, deny });
  }

  public toggleDeny(action: string): void {
    if (this.readOnly()) return;
    const model = this.matrix();
    const allow = new Set(model.allow);
    const deny = new Set(model.deny);
    deny.has(action) ? deny.delete(action) : (deny.add(action), allow.delete(action));
    this.matrixChange.emit({ ...model, allow, deny });
  }

  public allowedCount(module: string): number {
    return this.catalog().filter(i => i.module === module && this.matrix().allow.has(i.action)).length;
  }

  /** Allows or clears every action of a module at once. */
  public setModule(module: string, on: boolean): void {
    if (this.readOnly()) return;
    const model = this.matrix();
    const allow = new Set(model.allow);
    const deny = new Set(model.deny);
    for (const item of this.catalog().filter(i => i.module === module)) {
      if (on) { allow.add(item.action); deny.delete(item.action); } else allow.delete(item.action);
    }
    this.matrixChange.emit({ ...model, allow, deny });
  }
}
