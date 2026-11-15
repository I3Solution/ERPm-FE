import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CustomSelectComponent } from './custom-select.component';
import { LocalizationService } from '../../../core/services/localization.service';

describe('CustomSelectComponent', () => {
  let fixture: ComponentFixture<CustomSelectComponent>;
  const panel = () => document.body.querySelector('.custom-select-dropdown') as HTMLElement | null;
  const open = () => { fixture.nativeElement.querySelector('.custom-select-trigger').click(); fixture.detectChanges(); };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomSelectComponent],
      providers: [{ provide: LocalizationService, useValue: { currentLang: signal('vi'), translate: (key: string) => key } }]
    }).compileComponents();
    fixture = TestBed.createComponent(CustomSelectComponent);
    fixture.componentInstance.options = [{ value: 1, label: 'One' }, { value: 2, label: 'Two' }];
    fixture.detectChanges();
  });

  it('moves the open panel under <body> with fixed position so an overflow:hidden modal cannot clip it', () => {
    expect(panel()).toBeNull();
    open();
    expect(panel()!.parentElement).toBe(document.body);
    expect(panel()!.style.position).toBe('fixed');
  });

  it('picks an option from the body panel and removes the panel afterwards', () => {
    open();
    (panel()!.querySelector('.custom-select-option') as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe(1);
    expect(panel()).toBeNull();
  });

  it('removes the panel when the component is destroyed while open', () => {
    open();
    fixture.destroy();
    expect(panel()).toBeNull();
  });

  it('closes on Escape typed inside the panel', () => {
    open();
    panel()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });
});
