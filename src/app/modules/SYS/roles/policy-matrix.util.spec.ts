import { PermissionCatalogItem } from '../../../core/models/org.models';
import { fromMatrix, groupCatalog, toMatrix } from './policy-matrix.util';

const item = (module: string, resource: string, verb: string): PermissionCatalogItem =>
  ({ action: `${module}:${resource}:${verb}`, module, resource: `${module}:${resource}`, verb });
const catalog = [item('sd', 'order', 'view'), item('sd', 'order', 'edit'), item('wms', 'stock', 'view')];

describe('policy matrix conversion', () => {
  it('round-trips a simple policy', () => {
    const policy = {
      version: '1',
      statements: [
        { sid: 'Allow', effect: 'Allow' as const, actions: ['sd:order:view', 'wms:stock:view'], dataScope: { mode: 'BRANCH_TREE' } },
        { sid: 'Deny', effect: 'Deny' as const, actions: ['sd:order:edit'] }
      ]
    };
    const converted = toMatrix(policy, catalog);
    expect(converted.editable).toBeTrue();
    expect([...converted.model.allow]).toEqual(['sd:order:view', 'wms:stock:view']);
    expect([...converted.model.deny]).toEqual(['sd:order:edit']);
    expect(fromMatrix(converted.model, catalog)).toEqual(policy);
  });

  it('merges allow statements that share one range', () => {
    const converted = toMatrix({
      version: '1',
      statements: [
        { effect: 'Allow', actions: ['sd:order:view'], dataScope: { mode: 'COMPANY' } },
        { effect: 'Allow', actions: ['wms:stock:view'], dataScope: { mode: 'company' } }
      ]
    }, catalog);
    expect(converted.editable).toBeTrue();
    expect(converted.model.allow.size).toBe(2);
  });

  it('refuses the matrix when ranges differ, wildcards, resources or a scoped deny are used', () => {
    const differing = toMatrix({ version: '1', statements: [
      { effect: 'Allow', actions: ['sd:order:view'], dataScope: { mode: 'COMPANY' } },
      { effect: 'Allow', actions: ['wms:stock:view'], dataScope: { mode: 'BRANCH' } }] }, catalog);
    const wildcard = toMatrix({ version: '1', statements: [{ effect: 'Allow', actions: ['sd:*'] }] }, catalog);
    const resource = toMatrix({ version: '1', statements: [{ effect: 'Allow', actions: ['sd:order:view'], resources: ['order/1'] }] }, catalog);
    const scopedDeny = toMatrix({ version: '1', statements: [{ effect: 'Deny', actions: ['sd:order:view'], dataScope: { mode: 'BRANCH' } }] }, catalog);
    expect([differing, wildcard, resource, scopedDeny].map(c => c.editable)).toEqual([false, false, false, false]);
  });

  it('writes no statement for empty sets and keeps catalog order', () => {
    expect(fromMatrix({ allow: new Set(), deny: new Set(), scope: null }, catalog).statements).toEqual([]);
    const doc = fromMatrix({ allow: new Set(['wms:stock:view', 'sd:order:view']), deny: new Set(), scope: null }, catalog);
    expect(doc.statements[0].actions).toEqual(['sd:order:view', 'wms:stock:view']);
    expect(doc.statements[0].dataScope).toBeUndefined();
  });

  it('groups the catalog by module and resource', () => {
    const groups = groupCatalog(catalog);
    expect(groups.map(g => [g.module, g.count])).toEqual([['sd', 2], ['wms', 1]]);
    expect(groups[0].resources[0].items.length).toBe(2);
  });
});
