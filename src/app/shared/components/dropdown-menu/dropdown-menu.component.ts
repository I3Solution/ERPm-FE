import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface MenuItem {
  id: string;
  /** Dictionary key of the label. */
  label: string;
  icon?: string;
  danger?: boolean;
  disabled?: boolean;
}

/**
 * A button that opens a list of actions. The trigger is the projected content; the items are data, so a screen adds
 * a new action by adding an item. While open the panel lives under <body> with `position: fixed` (like
 * <app-custom-select>), so an overflow:hidden ancestor cannot clip it.
 */
@Component({
  selector: 'app-dropdown-menu',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './dropdown-menu.component.html',
  styleUrls: ['./dropdown-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownMenuComponent implements OnDestroy {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  @Input() items: MenuItem[] = [];
  /** Accessible name of the trigger button (dictionary key). */
  @Input() label = '';
  @Output() itemSelect = new EventEmitter<string>();

  public isOpen = signal(false);
  public activeIndex = signal(0);

  private panelEl: HTMLElement | null = null;
  private readonly reposition = () => { if (this.panelEl) this.placePanel(this.panelEl); };
  private readonly panelKey = (event: KeyboardEvent) => this.onKey(event);

  @ViewChild('panel') set panel(ref: ElementRef<HTMLElement> | undefined) {
    if (!ref) { this.detachPanel(); return; }
    if (this.panelEl === ref.nativeElement) return;
    this.panelEl = ref.nativeElement;
    document.body.appendChild(this.panelEl);
    this.placePanel(this.panelEl);
    window.addEventListener('resize', this.reposition);
    document.addEventListener('scroll', this.reposition, true);
    this.panelEl.addEventListener('keydown', this.panelKey);
    this.panelEl.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus();
  }

  ngOnDestroy(): void { this.detachPanel(); }

  public toggle(event: Event): void {
    event.stopPropagation();
    this.activeIndex.set(0);
    this.isOpen.update(open => !open);
  }

  public choose(item: MenuItem, event: Event): void {
    event.stopPropagation();
    if (item.disabled) return;
    this.close(false);
    this.itemSelect.emit(item.id);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (this.isOpen() && !this.host.nativeElement.contains(target) && !this.panelEl?.contains(target)) this.close(false);
  }

  @HostListener('keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    if (!this.isOpen()) return;
    const buttons = Array.from(this.panelEl?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []);
    const current = buttons.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'Escape') { event.preventDefault(); this.close(true); }
    else if (event.key === 'Tab') this.close(false);
    else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = event.key === 'ArrowDown' ? (current + 1) % buttons.length : (current <= 0 ? buttons.length - 1 : current - 1);
      buttons[next]?.focus();
    }
  }

  private close(returnFocus: boolean): void {
    this.isOpen.set(false);
    if (returnFocus) this.host.nativeElement.querySelector<HTMLElement>('.dm-trigger')?.focus();
  }

  private detachPanel(): void {
    if (!this.panelEl) return;
    window.removeEventListener('resize', this.reposition);
    document.removeEventListener('scroll', this.reposition, true);
    this.panelEl.removeEventListener('keydown', this.panelKey);
    // The panel lives under <body>, so destroying the component (page change) would leave it behind.
    this.panelEl.remove();
    this.panelEl = null;
  }

  /** Right-aligned under the trigger, or above it when there is more room there; kept inside the viewport. */
  private placePanel(panel: HTMLElement): void {
    const trigger = this.host.nativeElement.querySelector('.dm-trigger') as HTMLElement | null;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const style = panel.style;
    style.position = 'fixed';
    style.zIndex = '21000';
    style.minWidth = `${Math.max(rect.width, 180)}px`;
    style.right = `${Math.max(8, window.innerWidth - rect.right)}px`;
    style.left = 'auto';
    const openBelow = window.innerHeight - rect.bottom >= panel.offsetHeight + 12 || rect.top < window.innerHeight - rect.bottom;
    if (openBelow) { style.top = `${rect.bottom + 6}px`; style.bottom = 'auto'; }
    else { style.bottom = `${window.innerHeight - rect.top + 6}px`; style.top = 'auto'; }
  }
}
