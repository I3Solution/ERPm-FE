import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrgBranch, OrgUnitType } from '../../../core/models/org.models';
import { BranchBreadcrumbsComponent } from './branch-breadcrumbs.component';

const node = (id: number, name: string, orgUnitType: OrgUnitType, children: OrgBranch[] = []) =>
  ({ id, name, orgUnitType, children } as unknown as OrgBranch);

const TREE: OrgBranch[] = [
  node(1, 'Group', OrgUnitType.Group, [
    node(2, 'Company A', OrgUnitType.Company, [
      node(3, 'Hanoi', OrgUnitType.Branch, [node(4, 'Store 01', OrgUnitType.Branch, [node(5, 'Counter', OrgUnitType.Branch)])])
    ])
  ])
];

describe('BranchBreadcrumbsComponent', () => {
  let fixture: ComponentFixture<BranchBreadcrumbsComponent>;
  const labels = () => Array.from<Element>(fixture.nativeElement.querySelectorAll('.bc-label')).map(e => e.textContent!.trim());

  function render(branchId: number | null, extra: Partial<BranchBreadcrumbsComponent> = {}) {
    fixture = TestBed.createComponent(BranchBreadcrumbsComponent);
    fixture.componentRef.setInput('tree', TREE);
    fixture.componentRef.setInput('branchId', branchId);
    for (const [k, v] of Object.entries(extra)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
  }

  beforeEach(() => TestBed.configureTestingModule({ imports: [BranchBreadcrumbsComponent] }));

  it('shows the whole path without the group root', () => {
    render(4);
    expect(labels()).toEqual(['Company A', 'Hanoi', 'Store 01']);
  });

  it('highlights the company and marks the last item', () => {
    render(4);
    const items = fixture.nativeElement.querySelectorAll('.bc-item');
    expect(items[0].classList).toContain('is-company');
    expect(items[2].classList).toContain('is-last');
  });

  it('collapses the middle of a long path and expands on click', () => {
    render(5);
    expect(labels()).toEqual(['Company A', 'Counter']);
    fixture.nativeElement.querySelector('.bc-more').click();
    fixture.detectChanges();
    expect(labels()).toEqual(['Company A', 'Hanoi', 'Store 01', 'Counter']);
  });

  it('renders nothing for an unknown or empty id', () => {
    render(999);
    expect(fixture.nativeElement.querySelector('.bc')).toBeNull();
    render(null);
    expect(fixture.nativeElement.querySelector('.bc')).toBeNull();
  });

  it('exposes the full path as a tooltip', () => {
    render(4);
    expect(fixture.nativeElement.querySelector('.bc').getAttribute('title')).toBe('Company A › Hanoi › Store 01');
  });
});
