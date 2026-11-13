import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { InputControlComponent } from './input-control.component';

describe('InputControlComponent date type', () => {
  const create = (type: 'date' | 'datetime-local') => {
    TestBed.configureTestingModule({ imports: [InputControlComponent], providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(InputControlComponent);
    fixture.componentInstance.type = type;
    fixture.detectChanges();
    return fixture;
  };

  it('renders a date-only input and emits yyyy-MM-dd', () => {
    const fixture = create('date');
    const changes: unknown[] = [];
    fixture.componentInstance.registerOnChange((v: unknown) => changes.push(v));
    fixture.componentInstance.writeValue('2026-02-01T08:00:00');
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.type).toBe('date');
    expect(input.value).toBe('2026-02-01');
    input.value = '2026-03-05';
    input.dispatchEvent(new Event('input'));
    expect(changes).toEqual(['2026-03-05']);
  });

  it('keeps the date-time input for datetime-local', () => {
    const fixture = create('datetime-local');
    fixture.componentInstance.writeValue('2026-02-01T08:00:00');
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.type).toBe('datetime-local');
    expect(input.value).toBe('2026-02-01T08:00');
  });
});
