import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PermissionMatrixComponent } from './permission-matrix.component';
import { LocalizationService } from '../../../../../core/services/localization.service';
import { PermissionCatalogItem } from '../../../../../core/models/org.models';
import { MatrixModel } from '../../policy-matrix.util';

const item = (module: string, resource: string, verb: string): PermissionCatalogItem =>
  ({ action: `${module}:${resource}:${verb}`, module, resource: `${module}:${resource}`, verb });
const catalog = [item('sd', 'order', 'view'), item('sd', 'order', 'edit'), item('wms', 'stock', 'view')];

describe('PermissionMatrixComponent', () => {
  const create = (matrix: MatrixModel, readOnly = false) => {
    const fixture = TestBed.createComponent(PermissionMatrixComponent);
    fixture.componentRef.setInput('catalog', catalog);
    fixture.componentRef.setInput('matrix', matrix);
    fixture.componentRef.setInput('readOnly', readOnly);
    fixture.detectChanges();
    const emitted: MatrixModel[] = [];
    fixture.componentInstance.matrixChange.subscribe(model => emitted.push(model));
    return { component: fixture.componentInstance, emitted, fixture };
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionMatrixComponent],
      providers: [{ provide: LocalizationService, useValue: { currentLang: signal('vi'), translate: (key: string) => key } }]
    }).compileComponents();
  });

  it('keeps one action out of both the allow and deny sets', () => {
    const { component, emitted } = create({ allow: new Set(['sd:order:view']), deny: new Set(), scope: null });
    component.toggleDeny('sd:order:view');
    expect([...emitted[0].deny]).toEqual(['sd:order:view']);
    expect(emitted[0].allow.has('sd:order:view')).toBeFalse();
    const next = create(emitted[0]);
    next.component.toggleAllow('sd:order:view');
    expect(next.emitted[0].allow.has('sd:order:view') && !next.emitted[0].deny.has('sd:order:view')).toBeTrue();
  });

  it('allows or clears a whole module at once', () => {
    const { component, emitted } = create({ allow: new Set(), deny: new Set(['sd:order:edit']), scope: null });
    component.setModule('sd', true);
    expect([...emitted[0].allow].sort()).toEqual(['sd:order:edit', 'sd:order:view']);
    expect(emitted[0].deny.size).toBe(0);
    expect(component.allowedCount('wms')).toBe(0);
  });

  it('emits nothing when read only', () => {
    const { component, emitted } = create({ allow: new Set(), deny: new Set(), scope: null }, true);
    component.toggleAllow('sd:order:edit');
    component.toggleDeny('sd:order:edit');
    component.setModule('sd', true);
    expect(emitted).toEqual([]);
  });

  it('folds every module back when another role is opened', () => {
    const { component, fixture } = create({ allow: new Set(), deny: new Set(), scope: null });
    component.expandAll(true);
    expect(component.isOpen('sd')).toBeTrue();
    fixture.componentRef.setInput('resetKey', 1);
    fixture.detectChanges();
    expect(component.isOpen('sd')).toBeFalse();
  });
});
