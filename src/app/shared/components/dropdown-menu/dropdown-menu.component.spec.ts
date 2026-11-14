import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { DropdownMenuComponent } from './dropdown-menu.component';
import { LocalizationService } from '../../../core/services/localization.service';

describe('DropdownMenuComponent', () => {
  let fixture: ComponentFixture<DropdownMenuComponent>;
  const panel = () => document.body.querySelector('.dm-panel') as HTMLElement | null;
  const items = () => Array.from(document.body.querySelectorAll<HTMLElement>('.dm-item'));
  const trigger = () => fixture.nativeElement.querySelector('.dm-trigger') as HTMLButtonElement;
  const open = () => { trigger().click(); fixture.detectChanges(); };
  const key = (k: string) => { (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); fixture.detectChanges(); };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownMenuComponent],
      providers: [{ provide: LocalizationService, useValue: { currentLang: signal('vi'), translate: (k: string) => k } }]
    }).compileComponents();
    fixture = TestBed.createComponent(DropdownMenuComponent);
    fixture.componentInstance.items = [{ id: 'profile', label: 'menu.profile' }, { id: 'sign-out', label: 'auth.sign_out', danger: true }];
    fixture.detectChanges();
  });

  it('opens a fixed panel under <body> listing one button per item', () => {
    expect(panel()).toBeNull();
    open();
    expect(panel()!.parentElement).toBe(document.body);
    expect(panel()!.style.position).toBe('fixed');
    expect(items().length).toBe(2);
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });

  it('emits the chosen item and closes', () => {
    const chosen: string[] = [];
    fixture.componentInstance.itemSelect.subscribe(id => chosen.push(id));
    open();
    items()[1].click();
    fixture.detectChanges();
    expect(chosen).toEqual(['sign-out']);
    expect(panel()).toBeNull();
  });

  it('closes on Escape and gives the focus back to the trigger', () => {
    open();
    key('Escape');
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('closes when the page outside is clicked, not when the panel is', () => {
    open();
    panel()!.click();
    fixture.detectChanges();
    expect(panel()).not.toBeNull();
    document.body.click();
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('moves between items with the arrow keys, wrapping around', () => {
    open();
    expect(document.activeElement).toBe(items()[0]);
    key('ArrowDown');
    expect(document.activeElement).toBe(items()[1]);
    key('ArrowDown');
    expect(document.activeElement).toBe(items()[0]);
    key('ArrowUp');
    expect(document.activeElement).toBe(items()[1]);
  });

  it('closes when the browser Back button is used while it is open', () => {
    open();
    window.dispatchEvent(new PopStateEvent('popstate'));
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('marks phone-only items so wider screens hide them', () => {
    fixture.componentInstance.items = [{ id: 'lang', label: 'header.lang_en', mobileOnly: true }, { id: 'sign-out', label: 'auth.sign_out' }];
    fixture.componentRef.changeDetectorRef.markForCheck();
    open();
    expect(items().map(i => i.classList.contains('mobile-only'))).toEqual([true, false]);
  });

  it('removes the panel when the component is destroyed while open', () => {
    open();
    fixture.destroy();
    expect(panel()).toBeNull();
  });
});
