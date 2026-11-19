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
  template: `<app-detail-page title="Name" [loading]="loading" [error]="error" backLink="/list" [actions]="actions"
    (actionSelect)="picked = $event">
    <div actions><button type="button" (click)="picked = 'custom'">Custom</button></div>
    <p class="body">x</p>
  </app-detail-page>`
})
class HostComponent {
  loading = false;
  error = false;
  actions = [{ id: 'save', label: 'common.save', primary: true }];
  picked = '';
}

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
    (el().querySelector('app-action-bar .toolbar-start app-back-button button') as HTMLButtonElement).click();
    expect(back).toHaveBeenCalledWith('/list');
  });

  it('keeps custom buttons and standard actions in the same toolbar', () => {
    const toolbar = el().querySelector('app-action-bar .toolbar-actions') as HTMLElement;
    (toolbar.querySelector('[actions] button') as HTMLButtonElement).click();
    expect(fixture.componentInstance.picked).toBe('custom');
    (toolbar.querySelector('.toolbar-primary') as HTMLButtonElement).click();
    expect(fixture.componentInstance.picked).toBe('save');
  });

  it('hides the body while loading', () => {
    fixture.componentInstance.loading = true;
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(el().querySelector('.body')).toBeNull();
    expect(el().querySelector('app-skeleton')).toBeTruthy();
  });
});
