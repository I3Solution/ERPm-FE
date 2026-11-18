import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TreeViewComponent } from './tree-view.component';

describe('TreeViewComponent', () => {
  it('renders expanded branches and reveals filtered children without replacing the saved state', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(TreeViewComponent);
    fixture.componentRef.setInput('nodes', [
      { id: 1, data: 1, label: 'Parent', children: [{ id: 2, data: 2, label: 'Child' }] }
    ]);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const toggle = () => root.querySelector<HTMLButtonElement>('.tree-toggle')!;
    expect(root.textContent).not.toContain('Child');
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    toggle().click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Child');
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    toggle().click();
    fixture.componentRef.setInput('reveal', true);
    fixture.detectChanges();
    expect(root.textContent).toContain('Child');
    fixture.componentRef.setInput('reveal', false);
    fixture.detectChanges();
    expect(root.textContent).not.toContain('Child');
  });
});
