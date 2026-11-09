import { ChangeDetectorRef, inject, ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Optional,
  Output,
  Self,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NgControl } from '@angular/forms';
import { BranchSelectComponent } from '../branch-select/branch-select.component';
import { CurrencyInputDirective } from '../../directives/currency-input.directive';
import { OrgBranch, OrgUnitType } from '../../../core/models/org.models';
import {
  CustomSelectComponent,
  SelectOption
} from '../custom-select/custom-select.component';

export type InputControlType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'datetime-local'
  | 'email'
  | 'tel'
  | 'password'
  | 'textarea'
  | 'select'
  | 'branch-tree'
  | 'checkbox'
  | 'boolean';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-input-control',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, BranchSelectComponent, CurrencyInputDirective],
  templateUrl: './input-control.component.html',
  styleUrls: ['./input-control.component.scss']
})
export class InputControlComponent implements ControlValueAccessor {
  private detector = inject(ChangeDetectorRef);
  @Input() inputId = '';
  @Input() type: InputControlType = 'text';
  @Input() placeholder: string = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;

  // Numeric constraints
  @Input() min?: number;
  @Input() max?: number;
  @Input() step: number = 0.0001;

  // Textarea configuration
  @Input() rows: number = 3;

  // Prefix / Suffix / Unit adornments (e.g., currency symbol or measurement unit)
  @Input() prefix?: string;
  @Input() suffix?: string;
  @Input() checkboxLabel?: string;

  // Select / Dropdown configuration
  @Input() set dataSource(val: SelectOption[]) {
    this._dataSource.set(val || []);
  }
  get dataSource(): SelectOption[] {
    return this._dataSource();
  }

  @Input() set options(val: SelectOption[]) {
    this._dataSource.set(val || []);
  }
  get options(): SelectOption[] {
    return this._dataSource();
  }

  public _dataSource = signal<SelectOption[]>([]);

  // Organization tree picker (type 'branch-tree'): nested GET /branches/tree data and optional restrictions
  @Input() branchTree: OrgBranch[] = [];
  @Input() nodeTypeFilter: readonly OrgUnitType[] | null = null;
  @Input() scopeRootId: number | null = null;
  @Input() scopeMode: 'all' | 'selfAndChildren' = 'all';
  @Input() excludeSubtreeOf: number | null = null;

  @Input() searchable: boolean = false;
  @Input() allowClear: boolean = false;
  @Input() minWidth: string = '100%';
  @Input() invalid: boolean = false;

  @Input() set value(val: any) {
    this.internalValue.set(val);
    this.detector.markForCheck();
  }
  get value(): any {
    return this.internalValue();
  }

  @Output() valueChange = new EventEmitter<any>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() selectionChange = new EventEmitter<SelectOption | null>();
  @Output() blurred = new EventEmitter<void>();
  @Output() branchSelectionChange = new EventEmitter<OrgBranch | null>();

  public internalValue = signal<any>(null);

  // ControlValueAccessor callbacks
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(@Optional() @Self() public ngControl: NgControl | null) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  writeValue(value: any): void {
    this.internalValue.set(value);
    this.detector.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.detector.markForCheck();
  }

  // Format date-time for datetime-local native input (dd/MM/yyyy HH:mm in local UI)
  public formattedDateTimeValue(): string {
    const val = this.internalValue();
    if (!val) return '';
    if (val instanceof Date) {
      const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
      return `${val.getFullYear()}-${pad(val.getMonth() + 1)}-${pad(val.getDate())}T${pad(val.getHours())}:${pad(val.getMinutes())}`;
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed) return '';
      if (trimmed.includes('T')) {
        const clean = trimmed.replace('Z', '').split('.')[0];
        return clean.length >= 16 ? clean.substring(0, 16) : clean;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return `${trimmed}T00:00`;
      }
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
        return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
      }
      return trimmed;
    }
    return '';
  }

  public onDateTimeInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const rawValue = target ? target.value : '';
    this.internalValue.set(rawValue);
    this.onChange(rawValue);
    this.valueChange.emit(rawValue);
  }

  // Handle native text, date, email, tel, textarea changes
  public onTextChange(rawValue: string): void {
    this.internalValue.set(rawValue);
    this.onChange(rawValue);
    this.valueChange.emit(rawValue);
  }

  // Handle numeric and currency input changes
  public onNumberChange(rawValue: string | number | null): void {
    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      this.internalValue.set(null);
      this.onChange(null);
      this.valueChange.emit(null);
      return;
    }
    const parsed = Number(rawValue);
    const finalVal = Number.isNaN(parsed) ? 0 : parsed;
    this.internalValue.set(finalVal);
    this.onChange(finalVal);
    this.valueChange.emit(finalVal);
  }

  // Handle checkbox / boolean toggle changes
  public onCheckboxChange(checked: boolean): void {
    this.internalValue.set(checked);
    this.onChange(checked);
    this.onTouched();
    this.valueChange.emit(checked);
  }

  // Handle custom-select value changes
  public onSelectValueChange(val: any): void {
    this.internalValue.set(val);
    this.onChange(val);
    this.onTouched();
    this.valueChange.emit(val);
  }

  public onSelectOptionChange(opt: SelectOption | null): void {
    this.selectionChange.emit(opt);
  }

  public onBranchSelectionChange(branch: OrgBranch | null): void {
    this.branchSelectionChange.emit(branch);
  }

  public onBlur(): void {
    this.onTouched();
    this.blurred.emit();
  }
}

