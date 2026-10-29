import {
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  DestroyRef,
  Component,
  EventEmitter,
  Input,
  Optional,
  Output,
  Self,
  signal
} from '@angular/core';
import { LocalizationService } from '../../../core/services/localization.service';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NgControl,
  Validators
} from '@angular/forms';
import { FormGroupDirective } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  InputControlComponent,
  InputControlType
} from '../input-control/input-control.component';
import { SelectOption } from '../custom-select/custom-select.component';

@Component({
  selector: 'app-form-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, InputControlComponent],
  templateUrl: './form-control.component.html',
  styleUrls: ['./form-control.component.scss']
})
export class FormControlComponent implements ControlValueAccessor {
  public fieldId = 'erpm-' + crypto.randomUUID();
  private localization = inject(LocalizationService);
  private detector = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private parentForm = inject(FormGroupDirective, { optional: true });
  // Label & Field Metadata
  @Input() label: string = '';
  @Input() unit?: string;
  @Input() hint?: string;
  @Input() errorMessage?: string;
  @Input() required?: boolean;
  @Input() compact: boolean = false;

  // Input Control Delegation Properties
  @Input() type: InputControlType = 'text';
  @Input() placeholder: string = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() min?: number;
  @Input() max?: number;
  @Input() step: number = 0.0001;
  @Input() rows: number = 3;
  @Input() prefix?: string;
  @Input() suffix?: string;
  @Input() checkboxLabel?: string;

  // Select / Dropdown DataSource
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

  @Input() searchable: boolean = false;
  @Input() allowClear: boolean = false;
  @Input() minWidth: string = '100%';

  @Output() valueChange = new EventEmitter<any>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() selectionChange = new EventEmitter<SelectOption | null>();
  @Output() change = new EventEmitter<any>();

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

  ngOnInit(): void {
    this.ngControl?.control?.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.detector.markForCheck());
    this.parentForm?.ngSubmit.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.detector.markForCheck());
  }

  // Automatically detect whether the control is required via input or FormControl validator
  public get isRequired(): boolean {
    if (this.required !== undefined) {
      return this.required;
    }
    const control = this.ngControl?.control;
    if (control && typeof control.hasValidator === 'function') {
      return control.hasValidator(Validators.required);
    }
    return false;
  }

  // Determine whether validation errors should be displayed
  public get showError(): boolean {
    const control = this.ngControl?.control;
    if (!control) return false;
    return !!(control.invalid && (control.dirty || control.touched));
  }

  // Build standardized validation message from Angular FormControl errors
  public get resolvedErrorMessage(): string {
    if (this.errorMessage) return this.errorMessage;
    const errors = this.ngControl?.control?.errors;
    if (!errors) return '';

    if (errors['required']) {
      return this.localization.translate('error.validation.required');
    }
    if (errors['min']) {
      return this.localization.translate('error.validation.min') + ': ' + errors['min'].min;
    }
    if (errors['max']) {
      return this.localization.translate('error.validation.max') + ': ' + errors['max'].max;
    }
    if (errors['email']) {
      return this.localization.translate('error.validation.email');
    }
    if (errors['maxlength']) {
      return this.localization.translate('error.validation.maxlength') + ': ' + errors['maxlength'].requiredLength;
    }
    return this.localization.translate('error.validation.invalid');
  }

  public onInnerValueChange(val: any): void {
    this.internalValue.set(val);
    this.onChange(val);
    this.valueChange.emit(val);
    this.change.emit(val);
  }

  public onInnerSelectionChange(opt: SelectOption | null): void {
    this.selectionChange.emit(opt);
  }

  public onInnerBlur(): void {
    this.onTouched();
  }
}

