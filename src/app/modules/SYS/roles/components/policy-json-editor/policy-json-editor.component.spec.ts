import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PolicyJsonEditorComponent } from './policy-json-editor.component';
import { LocalizationService } from '../../../../../core/services/localization.service';

describe('PolicyJsonEditorComponent', () => {
  const create = (error: string | null, alert: boolean) => {
    const fixture = TestBed.createComponent(PolicyJsonEditorComponent);
    fixture.componentRef.setInput('control', new FormControl('{}', { nonNullable: true }));
    fixture.componentRef.setInput('error', error);
    fixture.componentRef.setInput('alert', alert);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PolicyJsonEditorComponent],
      providers: [{ provide: LocalizationService, useValue: { currentLang: signal('vi'), translate: (key: string) => key } }]
    }).compileComponents();
  });

  it('repeats the error as an alert only when asked to', () => {
    expect(create('role.json.invalid', true).querySelector('[role=alert]')?.textContent).toContain('role.json.invalid');
    expect(create('role.json.invalid', false).querySelector('[role=alert]')).toBeNull();
    expect(create(null, true).querySelector('[role=alert]')).toBeNull();
  });
});
