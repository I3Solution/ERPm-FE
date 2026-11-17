import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/** Sets a native tooltip with the full text, only while the cell content is actually cut off. */
@Directive({ selector: '[appCellOverflowTitle]', standalone: true })
export class CellOverflowTitleDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  @HostListener('mouseenter')
  public onEnter(): void {
    const cut = this.el.scrollHeight > this.el.clientHeight + 1 || this.el.scrollWidth > this.el.clientWidth + 1;
    if (cut) this.el.title = (this.el.innerText || '').trim();
    else this.el.removeAttribute('title');
  }
}
