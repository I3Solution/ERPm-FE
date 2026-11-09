import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NavigationHistoryService } from '../../../core/services/navigation-history.service';
import { DetailPageComponent } from './detail-page.component';

@Component({
  standalone: true,
  imports: [DetailPageComponent],
  template: `<app-detail-page title="Name" [loading]="loading" [error]="error" backLink="/list"><p class="body">x</p></app-detail-page>`
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

  it('renders the body and goes back through the navigation history with the list as fallback', () => {
    expect(el().querySelector('.body')).toBeTruthy();
    const back = spyOn(TestBed.inject(NavigationHistoryService), 'back');
    (el().querySelector('app-back-button button') as HTMLButtonElement).click();
    expect(back).toHaveBeenCalledWith('/list');
  });

  it('hides the body while loading', () => {
    fixture.componentInstance.loading = true;
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(el().querySelector('.body')).toBeNull();
    expect(el().querySelector('app-skeleton')).toBeTruthy();
  });
});
