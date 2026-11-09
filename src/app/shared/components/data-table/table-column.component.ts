import { Component, ContentChild, Input, TemplateRef } from '@angular/core';
import { ColumnAlign, ColumnType, TableBadgeConfig } from './data-table.models';
import { InputControlType } from '../input-control/input-control.component';
import { SelectOption } from '../custom-select/custom-select.component';

/**
 * Declarative column definition component for enterprise DataTable.
 *
 * Usage:
 * <app-column key="orderNumber" label="so.number" width="150px" [sortable]="true">
 *   <ng-template let-row="row">
 *     <span>{{ row.orderNumber }}</span>
 *   </ng-template>
 * </app-column>
 *
 * <app-column key="quantity" label="table.quantity" align="right" type="number" [editable]="true" [min]="1"></app-column>
 */
@Component({
  selector: 'app-column',
  standalone: true,
  template: ''
})
export class TableColumnComponent {
  @Input({ required: true }) key!: string;
  @Input() label = '';
  @Input() width?: string;
  @Input() minWidth?: string;
  @Input() align?: ColumnAlign = 'left';
  @Input() type?: ColumnType = 'text';
  @Input() sortable = false;
  @Input() sticky?: 'left' | 'right';
  @Input() nowrap = false;
  @Input() dateFormat?: string;
  @Input() numberFormat?: string;
  @Input() badgeMap?: Record<string, TableBadgeConfig>;
  @Input() visible = true;
  @Input() suffix?: string;
  @Input() prefix?: string;

  // Edit Mode properties
  @Input() editable = false;
  @Input() controlType?: InputControlType;
  @Input() options?: SelectOption[];
  @Input() placeholder?: string;
  @Input() min?: number;
  @Input() max?: number;
  @Input() step?: number;
  @Input() disabled = false;

  // Custom template projections
  @ContentChild(TemplateRef) cellTemplate?: TemplateRef<any>;
  @ContentChild('viewTemplate', { read: TemplateRef }) viewTemplate?: TemplateRef<any>;
  @ContentChild('editTemplate', { read: TemplateRef }) editTemplate?: TemplateRef<any>;
}
