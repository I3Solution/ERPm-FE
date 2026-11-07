import { Directive, ElementRef, HostListener, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'input[erpmCurrencyInput], input[appCurrencyInput]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyInputDirective),
      multi: true
    }
  ]
})
export class CurrencyInputDirective implements ControlValueAccessor {
  private el = inject(ElementRef<HTMLInputElement>);
  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  private format(val: any): string {
    if (val === null || val === undefined || val === '') return '';
    const clean = String(val).replace(/[^0-9-]/g, '');
    if (!clean || clean === '-') return clean;
    const num = Number(clean);
    return isNaN(num) ? '' : num.toLocaleString('en-US');
  }

  private parse(val: string): number {
    const clean = val.replace(/[^0-9-]/g, '');
    if (!clean || clean === '-') return 0;
    const num = Number(clean);
    return isNaN(num) ? 0 : num;
  }

  writeValue(value: any): void {
    this.el.nativeElement.value = this.format(value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }

  @HostListener('input', ['$event'])
  onInput(): void {
    const input = this.el.nativeElement;
    const cursor = input.selectionStart || 0;
    const oldLength = input.value.length;

    const numericValue = this.parse(input.value);
    const formatted = input.value.trim() === '' ? '' : this.format(numericValue);
    input.value = formatted;

    const newLength = formatted.length;
    const diff = newLength - oldLength;
    const newCursor = Math.max(0, cursor + diff);
    input.setSelectionRange(newCursor, newCursor);

    this.onChange(numericValue);
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
    const numericValue = this.parse(this.el.nativeElement.value);
    this.el.nativeElement.value = this.el.nativeElement.value.trim() === '' ? '' : this.format(numericValue);
  }
}
