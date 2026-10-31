import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BranchSelectComponent } from './branch-select.component';
import { LocalizationService } from '../../../core/services/localization.service';
import { OrgBranch, OrgUnitType } from '../../../core/models/org.models';

let nextId = 0;
const node = (type: OrgUnitType, name: string, children: OrgBranch[] = [], code = name.toUpperCase().replace(/\W+/g, '_')): OrgBranch => ({
  id: ++nextId, code, name, parentId: null, orgUnitType: type, companyId: null, isDefault: false, isActive: true, children
});

describe('BranchSelectComponent', () => {
  let fixture: ComponentFixture<BranchSelectComponent>;
  let component: BranchSelectComponent;
  let group: OrgBranch, companyA: OrgBranch, companyB: OrgBranch, hanoi: OrgBranch, store: OrgBranch, hcm: OrgBranch;

  const build = (): OrgBranch[] => {
    store = node(OrgUnitType.Branch, 'Store 01');
    hanoi = node(OrgUnitType.Branch, 'Ha Noi', [store]);
    hcm = node(OrgUnitType.Branch, 'Ho Chi Minh');
    companyA = node(OrgUnitType.Company, 'Company A', [hanoi, hcm]);
    companyB = node(OrgUnitType.Company, 'Company B', [node(OrgUnitType.Branch, 'Da Nang')]);
    group = node(OrgUnitType.Group, 'Head Office', [companyA, companyB]);
    return [group];
  };
  const labels = () => Array.from(document.body.querySelectorAll('.bs-row .option-label')).map((e: Element) => e.textContent?.trim());
  const open = () => { fixture.nativeElement.querySelector('.custom-select-trigger').click(); fixture.detectChanges(); };
  const rowFor = (label: string) => Array.from(document.body.querySelectorAll('.bs-row')).find((r: Element) => r.querySelector('.option-label')?.textContent?.trim() === label) as HTMLElement;
  const type = (text: string) => {
    const input = document.body.querySelector('.dropdown-search-input') as HTMLInputElement;
    input.value = text; input.dispatchEvent(new Event('input')); fixture.detectChanges();
  };

  beforeEach(async () => {
    nextId = 0;
    await TestBed.configureTestingModule({
      imports: [BranchSelectComponent],
      providers: [{ provide: LocalizationService, useValue: { currentLang: signal('vi'), translate: (key: string) => key } }]
    }).compileComponents();
    fixture = TestBed.createComponent(BranchSelectComponent);
    component = fixture.componentInstance;
    component.tree = build();
    fixture.detectChanges();
  });

  it('renders no panel until it is opened, and moves it to <body> so a modal cannot clip it', () => {
    expect(document.body.querySelector('.custom-select-dropdown')).toBeNull();
    open();
    const panel = document.body.querySelector('.custom-select-dropdown') as HTMLElement;
    expect(panel).not.toBeNull();
    expect(panel.parentElement).toBe(document.body);
    expect(panel.style.position).toBe('fixed');
    fixture.nativeElement.querySelector('.custom-select-trigger').click();
    fixture.detectChanges();
    expect(document.body.querySelector('.custom-select-dropdown')).toBeNull(); // removed again on close
  });

  it('removes its panel from <body> when the component is destroyed while open', () => {
    open();
    expect(document.body.querySelector('.custom-select-dropdown')).not.toBeNull();
    fixture.destroy();
    expect(document.body.querySelector('.custom-select-dropdown')).toBeNull();
  });

  it('opens with the roots expanded and everything deeper collapsed (collapsed children are not rendered)', () => {
    open();
    expect(labels()).toEqual(['Head Office', 'Company A', 'Company B']);
  });

  it('indents by depth and expands or collapses a node with its toggle', () => {
    open();
    rowFor('Company A').querySelector<HTMLButtonElement>('.bs-toggle')!.click();
    fixture.detectChanges();
    expect(labels()).toEqual(['Head Office', 'Company A', 'Ha Noi', 'Ho Chi Minh', 'Company B']);
    const padding = (label: string) => parseFloat(rowFor(label).style.paddingLeft);
    expect(padding('Company A')).toBeGreaterThan(padding('Head Office'));
    expect(padding('Ha Noi')).toBeGreaterThan(padding('Company A'));
    rowFor('Company A').querySelector<HTMLButtonElement>('.bs-toggle')!.click();
    fixture.detectChanges();
    expect(labels()).toEqual(['Head Office', 'Company A', 'Company B']);
  });

  it('opens down to the selected node and keeps the other branches collapsed', () => {
    component.writeValue(store.id);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.trigger-label').textContent.trim()).toBe('Store 01');
    open();
    expect(labels()).toEqual(['Head Office', 'Company A', 'Ha Noi', 'Store 01', 'Ho Chi Minh', 'Company B']);
    expect(rowFor('Store 01').classList).toContain('active');
  });

  it('filters by name or code only after the debounce and shows the ancestors of every match', fakeAsync(() => {
    open();
    type('store');
    expect(labels()).toEqual(['Head Office', 'Company A', 'Company B']); // nothing before the debounce
    tick(199);
    fixture.detectChanges();
    expect(labels()).toEqual(['Head Office', 'Company A', 'Company B']);
    tick(1);
    fixture.detectChanges();
    expect(labels()).toEqual(['Head Office', 'Company A', 'Ha Noi', 'Store 01']);
    type('DA_NANG'); // by code
    tick(200);
    fixture.detectChanges();
    expect(labels()).toEqual(['Head Office', 'Company B', 'Da Nang']);
    expect(rowFor('Company B').querySelector<HTMLButtonElement>('.bs-toggle')!.disabled).toBeTrue();
    type('');
    tick(200);
    fixture.detectChanges();
    expect(labels()).toEqual(['Head Office', 'Company A', 'Company B']);
  }));

  it('only the last keystroke of a burst triggers a search', fakeAsync(() => {
    open();
    type('s'); tick(100); type('st'); tick(100); type('sto');
    tick(199);
    fixture.detectChanges();
    expect(labels()).toEqual(['Head Office', 'Company A', 'Company B']);
    tick(1);
    fixture.detectChanges();
    expect(labels()).toEqual(['Head Office', 'Company A', 'Ha Noi', 'Store 01']);
  }));

  it('shows locked nodes that cannot be picked when a type filter is set', () => {
    component.nodeTypeFilter = [OrgUnitType.Company];
    const emitted: (number | null)[] = [];
    component.valueChange.subscribe(v => emitted.push(v));
    fixture.detectChanges();
    open();
    expect(rowFor('Head Office').classList).toContain('is-locked');
    rowFor('Head Office').click();
    fixture.detectChanges();
    expect(emitted).toEqual([]);
    expect(document.body.querySelector('.custom-select-dropdown')).not.toBeNull();
    rowFor('Company B').click();
    fixture.detectChanges();
    expect(emitted).toEqual([companyB.id]);
    expect(document.body.querySelector('.custom-select-dropdown')).toBeNull();
    expect(fixture.nativeElement.querySelector('.trigger-label').textContent.trim()).toBe('Company B');
  });

  it('limits the tree to one node and its descendants, and to nothing without a root', () => {
    component.scopeMode = 'selfAndChildren';
    component.scopeRootId = companyA.id;
    fixture.detectChanges();
    open();
    expect(labels()).toEqual(['Company A', 'Ha Noi', 'Ho Chi Minh']); // the scope root opens like any root
    rowFor('Company A').querySelector<HTMLButtonElement>('.bs-toggle')!.click();
    fixture.detectChanges();
    expect(labels()).toEqual(['Company A']);
    component.scopeRootId = null;
    fixture.detectChanges();
    expect(labels()).toEqual([]);
    expect(document.body.querySelector('.options-empty-state')).not.toBeNull();
  });

  it('hides the excluded subtree', () => {
    component.excludeSubtreeOf = hanoi.id;
    fixture.detectChanges();
    open();
    rowFor('Company A').querySelector<HTMLButtonElement>('.bs-toggle')!.click();
    fixture.detectChanges();
    expect(labels()).toEqual(['Head Office', 'Company A', 'Ho Chi Minh', 'Company B']);
  });

  it('works as a form control value: write, clear and emit', () => {
    component.allowClear = true;
    const changes: (number | null)[] = [];
    component.registerOnChange(v => changes.push(v));
    component.writeValue(hcm.id);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.trigger-label').textContent.trim()).toBe('Ho Chi Minh');
    fixture.nativeElement.querySelector('.clear-btn').click();
    fixture.detectChanges();
    expect(changes).toEqual([null]);
    expect(fixture.nativeElement.querySelector('.trigger-placeholder')).not.toBeNull();
  });

  it('picks with the keyboard: arrows move, Enter selects, Escape closes', () => {
    const trigger = fixture.nativeElement.querySelector('.custom-select-wrapper') as HTMLElement;
    const key = (k: string) => { trigger.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); fixture.detectChanges(); };
    const emitted: (number | null)[] = [];
    component.valueChange.subscribe(v => emitted.push(v));
    key('ArrowDown');
    expect(document.body.querySelector('.custom-select-dropdown')).not.toBeNull();
    key('ArrowDown'); key('ArrowDown');
    key('Enter');
    expect(emitted).toEqual([companyA.id]);
    key('ArrowDown');
    key('Escape');
    expect(document.body.querySelector('.custom-select-dropdown')).toBeNull();
  });

  describe('with a large tree', () => {
    const big = (): { tree: OrgBranch[]; total: number } => {
      let total = 1;
      const companies = Array.from({ length: 12 }, (_, c) => {
        const branches = Array.from({ length: 8 }, (_, b) => {
          const stores = Array.from({ length: 5 }, (_, s) => node(OrgUnitType.Branch, `Store ${c}-${b}-${s}`));
          total += 1 + stores.length;
          return node(OrgUnitType.Branch, `Branch ${c}-${b}`, stores);
        });
        total += 1;
        return node(OrgUnitType.Company, `Company ${c}`, branches);
      });
      return { tree: [node(OrgUnitType.Group, 'Head Office', companies)], total };
    };

    it('renders only the visible rows and stays fast to index, search and expand', fakeAsync(() => {
      const { tree, total } = big();
      expect(total).toBeGreaterThan(550);
      const indexStart = performance.now();
      component.tree = tree;
      fixture.detectChanges();
      open();
      const openMs = performance.now() - indexStart;
      expect(labels().length).toBe(13); // group + 12 companies, nothing deeper is rendered
      expect(document.body.querySelectorAll('.bs-row').length).toBe(13);

      const searchStart = performance.now();
      type('store 7-3');
      tick(200);
      fixture.detectChanges();
      const searchMs = performance.now() - searchStart;
      expect(labels()).toEqual(['Head Office', 'Company 7', 'Branch 7-3', 'Store 7-3-0', 'Store 7-3-1', 'Store 7-3-2', 'Store 7-3-3', 'Store 7-3-4']);
      // Generous bounds; the point is that nothing scales with the whole tree on each interaction.
      expect(openMs).toBeLessThan(500);
      expect(searchMs).toBeLessThan(500);
    }));
  });
});
