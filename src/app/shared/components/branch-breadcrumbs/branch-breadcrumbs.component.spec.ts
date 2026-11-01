import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrgBranch, OrgUnitType } from '../../../core/models/org.models';
import { BranchBreadcrumbsComponent } from './branch-breadcrumbs.component';

const node = (id: number, name: string, orgUnitType: OrgUnitType, children: OrgBranch[] = []) =>
  ({ id, name, orgUnitType, children } as unknown as OrgBranch);

const TREE: OrgBranch[] = [
  node(1, 'Group', OrgUnitType.Group, [
    node(2, 'Company A', OrgUnitType.Company, [
      node(3, 'Hanoi', OrgUnitType.Branch, [node(4, 'Store 01', OrgUnitType.Branch)])
    ])
  ])
];

describe('BranchBreadcrumbsComponent', () => {
  let fixture: ComponentFixture<BranchBreadcrumbsComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const levels = () => Array.from(el().querySelectorAll('.bc-level .bc-label')).map(e => e.textContent!.trim());

  function render(branchId: number | null, extra: Record<string, unknown> = {}) {
    fixture = TestBed.createComponent(BranchBreadcrumbsComponent);
    fixture.componentRef.setInput('tree', TREE);
    fixture.componentRef.setInput('branchId', branchId);
    for (const [k, v] of Object.entries(extra)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
  }
  const hover = () => { el().querySelector('.bc')!.dispatchEvent(new Event('mouseenter')); fixture.detectChanges(); };

  beforeEach(() => TestBed.configureTestingModule({ imports: [BranchBreadcrumbsComponent] }));

  it('shows only the node name and no popover until hovered', () => {
    render(4);
    expect(el().querySelector('.bc-name')!.textContent!.trim()).toBe('Store 01');
    expect(el().querySelector('.bc')!.textContent!.trim()).toBe('Store 01');
    expect(el().querySelector('.bc-pop')).toBeNull();
  });

  it('lists every level from the root, indented, on hover and closes on leave', () => {
    render(4);
    hover();
    expect(levels()).toEqual(['Group', 'Company A', 'Hanoi', 'Store 01']);
    const items = el().querySelectorAll<HTMLElement>('.bc-level');
    expect(items[1].classList).toContain('is-company');
    expect(items[3].classList).toContain('is-last');
    el().querySelector('.bc')!.dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();
    expect(el().querySelector('.bc-pop')).toBeNull();
  });

  it('can leave the group root out', () => {
    render(4, { skipGroup: true });
    hover();
    expect(levels()).toEqual(['Company A', 'Hanoi', 'Store 01']);
  });

  it('opens on focus and toggles on click (touch)', () => {
    render(3);
    el().querySelector('.bc')!.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(el().querySelector('.bc-pop')).not.toBeNull();
    (el().querySelector('.bc') as HTMLElement).click();
    fixture.detectChanges();
    expect(el().querySelector('.bc-pop')).toBeNull();
  });

  it('renders nothing for an unknown or empty id', () => {
    render(999);
    expect(el().querySelector('.bc')).toBeNull();
    render(null);
    expect(el().querySelector('.bc')).toBeNull();
  });
});
