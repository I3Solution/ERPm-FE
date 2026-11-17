import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { FileTransferService } from '../../../core/services/file-transfer.service';
import { ImportDialogComponent } from './import-dialog.component';

describe('ImportDialogComponent', () => {
  let fixture: ComponentFixture<ImportDialogComponent>;
  let component: ImportDialogComponent;
  let transferSpy: jasmine.SpyObj<FileTransferService>;

  beforeEach(async () => {
    transferSpy = jasmine.createSpyObj<FileTransferService>('FileTransferService', ['importFile', 'exportFile']);

    await TestBed.configureTestingModule({
      imports: [ImportDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: FileTransferService, useValue: transferSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ImportDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('importUrl', '/api/v1/test/import');
    fixture.detectChanges();
  });

  it('rejects unsupported file extensions before uploading', () => {
    const badFile = new File(['bad'], 'notes.txt', { type: 'text/plain' });
    component.selectedFile.set(badFile);
    component.submit();

    expect(component.clientError()).toBe('transfer.invalid_file_type');
    expect(transferSpy.importFile).not.toHaveBeenCalled();
  });

  it('displays row errors when server returns failed import rows', () => {
    const goodFile = new File(['xlsx'], 'data.xlsx');
    component.selectedFile.set(goodFile);
    transferSpy.importFile.and.returnValue(of({
      success: true,
      data: {
        totalRows: 2,
        validCount: 1,
        errorCount: 1,
        isSuccess: false,
        items: [{}],
        errors: [{ rowNumber: 3, column: 'Code', errorCode: 'error.import.required', message: 'Required' }]
      }
    }));

    component.submit();

    expect(component.errors().length).toBe(1);
    expect(component.summary()?.errorCount).toBe(1);
  });

  it('emits imported event when all rows succeed', () => {
    const goodFile = new File(['xlsx'], 'data.xlsx');
    component.selectedFile.set(goodFile);
    let emitted = false;
    component.imported.subscribe(() => { emitted = true; });

    transferSpy.importFile.and.returnValue(of({
      success: true,
      data: { totalRows: 1, validCount: 1, errorCount: 0, isSuccess: true, items: [{}], errors: [] }
    }));

    component.submit();

    expect(emitted).toBeTrue();
    expect(component.errors().length).toBe(0);
  });
});
