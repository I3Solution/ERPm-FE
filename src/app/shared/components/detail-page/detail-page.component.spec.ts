import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { DetailPageComponent } from './detail-page.component';

@Component({
  standalone: true,
  imports: [DetailPageComponent],
  template: `<app-detail-page title="Name" [loading]="loading" [error]="error" [backLink]="['/list']" [backQueryParams]="{ page: '2' }"><p class="body">x</p></app-detail-page>`
})
class HostComponent { loading = false; error = false; }

describe('DetailPageComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders the body and goes back with the list query params', () => {
    expect(el().querySelector('.body')).toBeTruthy();
    const nav = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    (el().querySelector('app-back-button button') as HTMLButtonElement).click();
    expect(nav).toHaveBeenCalledWith(['/list'], { queryParams: { page: '2' } });
  });

  it('hides the body while loading', () => {
    fixture.componentInstance.loading = true;
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(el().querySelector('.body')).toBeNull();
    expect(el().querySelector('app-skeleton')).toBeTruthy();
  });
});
