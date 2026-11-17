import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { FileTransferService } from './file-transfer.service';

describe('FileTransferService', () => {
  let service: FileTransferService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(FileTransferService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('extracts UTF-8 filename from Content-Disposition', () => {
    const header = "attachment; filename=\"fallback.xlsx\"; filename*=UTF-8''BaoCao%20TuoiNo.xlsx";
    expect(service.extractFileName(header, 'default.xlsx')).toBe('BaoCao TuoiNo.xlsx');
    expect(service.extractFileName('attachment; filename="report.xlsx"', 'default.xlsx')).toBe('report.xlsx');
    expect(service.extractFileName(null, 'default.xlsx')).toBe('default.xlsx');
  });

  it('calls GET with blob responseType and query params on exportFile', () => {
    let downloadedName = '';
    spyOn(URL, 'createObjectURL').and.returnValue('blob:mock');
    spyOn(URL, 'revokeObjectURL');

    service.exportFile('/api/v1/reports/ar-aging/export', { branchId: 1, q: undefined }, 'ar.xlsx')
      .subscribe(name => { downloadedName = name; });

    const req = httpMock.expectOne('/api/v1/reports/ar-aging/export?branchId=1');
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');

    req.flush(new Blob(['xlsx']), {
      headers: { 'Content-Disposition': 'attachment; filename="ar-aging-2026.xlsx"' }
    });

    expect(downloadedName).toBe('ar-aging-2026.xlsx');
  });

  it('posts FormData with file and extraFields on importFile', () => {
    const file = new File(['dummy'], 'accounts.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    let success = false;

    service.importFile('/api/v1/accounts/import', file, { branchId: 2 })
      .subscribe(res => { success = res.success; });

    const req = httpMock.expectOne('/api/v1/accounts/import');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    const formData = req.request.body as FormData;
    expect(formData.get('branchId')).toBe('2');
    expect((formData.get('file') as File).name).toBe('accounts.xlsx');

    req.flush({
      success: true,
      data: { totalRows: 1, validCount: 1, errorCount: 0, isSuccess: true, items: [{}], errors: [] }
    });
    expect(success).toBeTrue();
  });
});
