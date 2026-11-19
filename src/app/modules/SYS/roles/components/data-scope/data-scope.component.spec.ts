import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DataScopeComponent } from './data-scope.component';
import { LocalizationService } from '../../../../../core/services/localization.service';
import { OrgBranch } from '../../../../../core/models/org.models';

describe('DataScopeComponent', () => {
  const create = (branchIds: number[]) => {
    const fixture = TestBed.createComponent(DataScopeComponent);
    fixture.componentRef.setInput('modeControl', new FormControl('CUSTOM_BRANCHES', { nonNullable: true }));
    fixture.componentRef.setInput('descendantsControl', new FormControl(false, { nonNullable: true }));
    fixture.componentRef.setInput('options', []);
    fixture.componentRef.setInput('showCustomBranches', true);
    fixture.componentRef.setInput('branchIds', branchIds);
    fixture.componentRef.setInput('branchTree', [{ id: 1, name: 'Head', children: [{ id: 3, name: 'Hanoi', children: [] }] } as unknown as OrgBranch]);
    fixture.detectChanges();
    const emitted: number[][] = [];
    fixture.componentInstance.branchIdsChange.subscribe(ids => emitted.push(ids));
    return { component: fixture.componentInstance, emitted };
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataScopeComponent],
      providers: [{ provide: LocalizationService, useValue: { currentLang: signal('vi'), translate: (key: string) => key } }]
    }).compileComponents();
  });

  it('adds a unit once and removes one on request', () => {
    const { component, emitted } = create([3]);
    component.add(3);
    component.add(null);
    expect(emitted).toEqual([]);
    component.add(1);
    component.remove(3);
    expect(emitted).toEqual([[3, 1], []]);
  });

  it('shows a unit by name, falling back to its id', () => {
    const { component } = create([3]);
    expect(component.branchName(3)).toBe('Hanoi');
    expect(component.branchName(99)).toBe('99');
  });
});
