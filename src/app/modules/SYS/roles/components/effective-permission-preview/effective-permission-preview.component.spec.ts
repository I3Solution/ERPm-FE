import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { EffectivePermissionPreviewComponent } from './effective-permission-preview.component';
import { LocalizationService } from '../../../../../core/services/localization.service';
import { EffectivePermission, PermissionCatalogItem } from '../../../../../core/models/org.models';

const item = (module: string, resource: string, verb: string): PermissionCatalogItem =>
  ({ action: `${module}:${resource}:${verb}`, module, resource: `${module}:${resource}`, verb });

describe('EffectivePermissionPreviewComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EffectivePermissionPreviewComponent],
      providers: [{ provide: LocalizationService, useValue: { currentLang: signal('vi'), translate: (key: string) => key } }]
    }).compileComponents();
  });

  it('counts allowed and denied actions and filters the groups', () => {
    const rows: EffectivePermission[] = [
      { ...item('sd', 'order', 'view'), status: 'Denied', sources: [{ source: 'inline-policy', sid: 'NoOrders', effect: 'Deny' }] },
      { ...item('wms', 'stock', 'view'), status: 'Allowed', sources: [{ source: 'job-position:SALES', effect: 'Allow' }] },
      { ...item('sd', 'order', 'edit'), status: 'NotGranted', sources: [] }
    ];
    const fixture = TestBed.createComponent(EffectivePermissionPreviewComponent);
    fixture.componentRef.setInput('rows', rows);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.counts()).toEqual({ allowed: 1, denied: 1 });
    component.filter.set('Denied');
    expect(component.groups().map(g => g.items.map(i => i.action))).toEqual([['sd:order:view']]);
    expect(component.sourceLabel('job-position:SALES')).toBe('role.source.job-position: SALES');
    expect(component.sourceLabel('inline-policy')).toBe('role.source.inline-policy');
  });
});
