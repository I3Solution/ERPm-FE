import { Directive, Input, TemplateRef } from '@angular/core';

/**
 * Structural directive used to provide custom cell templates for DataTable columns.
 * Usage:
 * <ng-template appDataTableCell="productName" let-row="row" let-index="index" let-group="group">
 *   <span>{{ row.productName }}</span>
 * </ng-template>
 */
@Directive({
  selector: '[appDataTableCell]',
  standalone: true
})
export class DataTableCellDirective {
  @Input('appDataTableCell') columnKey!: string;

  constructor(public templateRef: TemplateRef<any>) {}
}
