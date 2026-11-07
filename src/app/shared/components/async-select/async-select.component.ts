import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  computed,
  forwardRef,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SelectOption } from '../custom-select/custom-select.component';

export interface AsyncSelectOption extends SelectOption {
  code?: string;
  barcode?: string;
  price?: number;
  vatRate?: number;
  unitName?: string;
}

@Component({
  selector: 'app-async-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './async-select.component.html',
  styleUrls: ['./async-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AsyncSelectComponent),
      multi: true
    }
  ]
})
export class AsyncSelectComponent implements OnInit, OnDestroy, ControlValueAccessor {
  private elementRef = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);

  @Input() set options(val: AsyncSelectOption[]) {
    this._options.set(val || []);
  }
  get options(): AsyncSelectOption[] {
    return this._options();
  }
  public _options = signal<AsyncSelectOption[]>([]);

  @Input() placeholder = 'Tìm theo SKU, Tên sản phẩm, Barcode...';
  @Input() debounceMs = 250;
  @Input() loading = false;
  @Input() disabled = false;
  @Input() resetOnSelect = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  @Input() set value(val: any) {
    this.currentValue.set(val);
  }
  get value(): any {
    return this.currentValue();
  }

  @Output() valueChange = new EventEmitter<any>();
  @Output() optionSelected = new EventEmitter<AsyncSelectOption>();
  @Output() searchChange = new EventEmitter<string>();

  public isOpen = signal<boolean>(false);
  public searchKeyword = signal<string>('');
  public currentValue = signal<any>(null);
  public activeIndex = signal<number>(0);

  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  public selectedOption = computed<AsyncSelectOption | undefined>(() => {
    const val = this.currentValue();
    if (val === null || val === undefined || val === '') return undefined;
    return this._options().find(o => o.value === val || String(o.value) === String(val));
  });

  public filteredOptions = computed<AsyncSelectOption[]>(() => {
    const kw = this.searchKeyword().trim().toLowerCase();
    const all = this._options();
    if (!kw) return all;
    return all.filter(
      opt =>
        opt.label.toLowerCase().includes(kw) ||
        (opt.code && opt.code.toLowerCase().includes(kw)) ||
        (opt.barcode && opt.barcode.toLowerCase().includes(kw)) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(kw)) ||
        (opt.searchText && opt.searchText.toLowerCase().includes(kw))
    );
  });

  ngOnInit(): void {
    this.searchSub = this.searchSubject
      .pipe(debounceTime(this.debounceMs), distinctUntilChanged())
      .subscribe(kw => {
        this.searchChange.emit(kw);
      });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  writeValue(value: any): void {
    this.currentValue.set(value);
    this.cdr.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  public openDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.disabled) return;
    this.isOpen.set(true);
    this.activeIndex.set(0);
  }

  public onSearchInput(value: string): void {
    this.searchKeyword.set(value);
    this.isOpen.set(true);
    this.activeIndex.set(0);
    this.searchSubject.next(value.trim());
  }

  public selectOption(opt: AsyncSelectOption, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (opt.disabled) return;

    if (this.resetOnSelect) {
      this.currentValue.set(null);
      this.searchKeyword.set('');
    } else {
      this.currentValue.set(opt.value);
      this.searchKeyword.set('');
      this.onChange(opt.value);
      this.valueChange.emit(opt.value);
    }

    this.onTouched();
    this.optionSelected.emit(opt);
    this.isOpen.set(false);
  }

  public onKeyDown(event: KeyboardEvent): void {
    if (this.disabled) return;
    const list = this.filteredOptions();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.isOpen.set(true);
      this.activeIndex.set(Math.min(list.length - 1, this.activeIndex() + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.isOpen.set(true);
      this.activeIndex.set(Math.max(0, this.activeIndex() - 1));
    } else if (event.key === 'Enter') {
      if (this.isOpen() && list.length > 0) {
        event.preventDefault();
        const target = list[this.activeIndex()] ?? list[0];
        if (target) {
          this.selectOption(target, event);
        }
      }
    } else if (event.key === 'Escape') {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.isOpen()) {
        this.isOpen.set(false);
        this.searchKeyword.set('');
        this.onTouched();
      }
    }
  }
}
