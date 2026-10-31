import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrgAdminService } from './org-admin.service';
import { OrgUnitType } from '../models/org.models';

describe('OrgAdminService', () => {
  let service: OrgAdminService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(OrgAdminService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('unwraps the API envelope', () => {
    let tree: unknown;
    service.branchTree().subscribe(result => tree = result);
    http.expectOne('/api/v1/branches/tree').flush({ success: true, data: [{ id: 1, code: 'root' }] });
    expect(tree).toEqual([{ id: 1, code: 'root' }] as never);
  });

  it('sends list filters as query parameters and drops empty values', () => {
    service.departments({ underId: 5, levelCode: 'SECTION', keyword: '', pageSize: 50 }).subscribe();
    const request = http.expectOne(r => r.url === '/api/v1/hrm/departments');
    expect(request.request.params.get('underId')).toBe('5');
    expect(request.request.params.get('levelCode')).toBe('SECTION');
    expect(request.request.params.get('pageSize')).toBe('50');
    expect(request.request.params.has('keyword')).toBeFalse();
    request.flush({ success: true, data: { items: [], totalCount: 0, pageIndex: 1, pageSize: 50 } });
  });

  it('keeps the node type on create and updates through PUT', () => {
    service.createBranch({ code: 'C1', name: 'Company', parentId: 1, orgUnitType: OrgUnitType.Company }).subscribe();
    const create = http.expectOne('/api/v1/branches');
    expect(create.request.method).toBe('POST');
    expect(create.request.body.orgUnitType).toBe(OrgUnitType.Company);
    create.flush({ success: true, data: {} });
    service.updateBranch(7, { code: 'C1', name: 'Renamed', parentId: 1 }).subscribe();
    const update = http.expectOne('/api/v1/branches/7');
    expect(update.request.method).toBe('PUT');
    expect(update.request.body.orgUnitType).toBeUndefined();
    update.flush({ success: true, data: {} });
  });

  it('addresses department roles and job position roles', () => {
    service.setDepartmentRoles(3, [{ roleId: 2, applyToChildren: true }]).subscribe();
    const grants = http.expectOne('/api/v1/sys/roles/departments/3');
    expect(grants.request.method).toBe('PUT');
    expect(grants.request.body).toEqual([{ roleId: 2, applyToChildren: true }]);
    grants.flush({ success: true, data: [] });
    service.setJobPositionRoles(4, [1, 2]).subscribe();
    const positionRoles = http.expectOne('/api/v1/sys/roles/job-positions/4');
    expect(positionRoles.request.body).toEqual({ roleIds: [1, 2] });
    positionRoles.flush({ success: true, data: [1, 2] });
  });
});
