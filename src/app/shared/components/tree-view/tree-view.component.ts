import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, TemplateRef, input, model } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

export type TreeKey = string | number;

export interface TreeNode<T> {
  id: TreeKey;
  label: string;
  data: T;
  children?: readonly TreeNode<T>[];
}

@Component({
  selector: 'app-tree-view',
  standalone: true,
  imports: [NgTemplateOutlet, TranslatePipe],
  templateUrl: './tree-view.component.html',
  styleUrl: './tree-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreeViewComponent<T> {
  public readonly nodes = input.required<readonly TreeNode<T>[]>();
  public readonly nodeTemplate = input<TemplateRef<{ $implicit: TreeNode<T> }>>();
  public readonly expanded = model<ReadonlySet<TreeKey>>(new Set());
  public readonly toggleFromLabel = input(false);
  /** Reveals a filtered tree without changing its saved expansion. */
  public readonly reveal = input(false);

  public toggle(id: TreeKey): void {
    const next = new Set(this.expanded());
    if (!next.delete(id)) next.add(id);
    this.expanded.set(next);
  }
}
