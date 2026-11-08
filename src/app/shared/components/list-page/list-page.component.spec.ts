import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ListPageComponent } from './list-page.component';

@Component({
  standalone: true,
  imports: [ListPageComponent],
  template: `<app-list-page title="t" [loading]="loading" [error]="error" [count]="count" [total]="total" [page]="page" [pageSize]="10"
    (pageChange)="changed = $event" (retry)="retried = true"><p class="row">rows</p></app-list-page>`
})
class HostComponent {
  loading = false; error = false; count = 0; total = 0; page = 1; changed = 0; retried = false;
}

describe('ListPageComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const el = () => fixture.nativeElement as HTMLElement;
  const update = () => { fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the empty state when nothing is loaded', () => {
    expect(el().querySelector('.list-empty')).toBeTruthy();
    expect((el().querySelector('.list-body') as HTMLElement).hidden).toBeTrue();
  });

  it('shows a skeleton on first load', () => {
    host.loading = true; update();
    expect(el().querySelector('app-skeleton')).toBeTruthy();
    expect(el().querySelector('.list-empty')).toBeNull();
  });

  it('shows error with retry', () => {
    host.error = true; update();
    (el().querySelector('.list-error button') as HTMLButtonElement).click();
    expect(host.retried).toBeTrue();
  });

  it('shows rows and pages forward', () => {
    host.count = 10; host.total = 25; update();
    expect((el().querySelector('.list-body') as HTMLElement).hidden).toBeFalse();
    const buttons = el().querySelectorAll('.paging-buttons button');
    (buttons[1] as HTMLButtonElement).click();
    expect(host.changed).toBe(2);
    expect((buttons[0] as HTMLButtonElement).disabled).toBeTrue();
  });

  it('pulls a page beyond the last page back to the last page', () => {
    host.count = 0; host.total = 25; host.page = 9; update();
    expect(host.changed).toBe(3);
  });
});
