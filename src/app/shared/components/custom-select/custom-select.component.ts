import { ChangeDetectorRef, inject, ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  computed,
  forwardRef,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface SelectOption {
  value: any;
  label: string;
  icon?: string;
  sublabel?: string;
  badge?: string;
  disabled?: boolean;
  searchText?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './custom-select.component.html',
  styleUrls: ['./custom-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ]
})
export class CustomSelectComponent implements ControlValueAccessor {
  private detector = inject(ChangeDetectorRef);
  @Input() inputId = '';
  public activeIndex = signal(0);
  @Input() set options(val: SelectOption[]) {
    this._options.set(val || []);
  }
  get options(): SelectOption[] {
    return this._options();
  }
  public _options = signal<SelectOption[]>([]);

  @Input() placeholder = '';
  @Input() searchable: boolean = false;
  @Input() allowClear: boolean = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() minWidth: string = '180px';
  @Input() disabled: boolean = false;

  @Input() set value(val: any) {
    this.currentValue.set(val);
  }
  get value(): any {
    return this.currentValue();
  }

  @Output() valueChange = new EventEmitter<any>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() selectionChange = new EventEmitter<SelectOption | null>();
  @Output() change = new EventEmitter<any>();

  public isOpen = signal<boolean>(false);
  public searchKeyword = signal<string>('');
  public currentValue = signal<any>(null);

  // ControlValueAccessor callbacks
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  public selectedOption = computed<SelectOption | undefined>(() => {
    const val = this.currentValue();
    return this._options().find(opt => opt.value === val);
  });

  public filteredOptions = computed<SelectOption[]>(() => {
    const keyword = this.searchKeyword().trim().toLowerCase();
    const opts = this._options();
    if (!keyword) return opts;
    return opts.filter(
      opt =>
        opt.label.toLowerCase().includes(keyword) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(keyword)) || !!opt.searchText?.toLowerCase().includes(keyword)
    );
  });

  constructor(private elementRef: ElementRef) {}

  // ControlValueAccessor methods
  writeValue(value: any): void {
    this.currentValue.set(value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.detector.markForCheck();
  }

  public toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled) return;
    this.isOpen.update(open => !open);
    if (this.isOpen()) {
      this.searchKeyword.set('');
    } else {
      this.onTouched();
    }
  }

  public select(option: SelectOption, event: Event): void {
    event.stopPropagation();
    if (option.disabled) return;

    this.currentValue.set(option.value);
    this.onChange(option.value);
    this.onTouched();
    this.valueChange.emit(option.value);
    this.selectionChange.emit(option);
    this.change.emit(option.value);
    this.isOpen.set(false);
  }

  public clear(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled) return;

    this.currentValue.set(null);
    this.onChange(null);
    this.onTouched();
    this.valueChange.emit(null);
    this.selectionChange.emit(null);
    this.change.emit(null);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.isOpen()) {
        this.isOpen.set(false);
        this.onTouched();
      }
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
      this.onTouched();
    }
  }

  @HostListener('keydown', ['$event'])
  public onKey(event: KeyboardEvent): void {
    if (this.disabled) return;
    const options = this.filteredOptions().filter(option => !option.disabled);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const wasOpen = this.isOpen(); this.isOpen.set(true);
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      this.activeIndex.set(wasOpen ? Math.max(0, Math.min(options.length - 1, this.activeIndex() + delta)) : event.key === 'ArrowDown' ? 0 : Math.max(0, options.length - 1));
    } else if (event.key === 'Enter' || event.key === ' ') {
      if ((event.target as HTMLElement).tagName === 'INPUT' && event.key === ' ') return;
      event.preventDefault();
      if (!this.isOpen()) this.isOpen.set(true);
      else if (options[this.activeIndex()]) this.select(options[this.activeIndex()], event);
    }
  }
}
