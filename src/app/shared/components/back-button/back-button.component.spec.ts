import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BackButtonComponent } from './back-button.component';
import { NavigationHistoryService } from '../../../core/services/navigation-history.service';

describe('BackButtonComponent', () => {
  let component: BackButtonComponent;
  let fixture: ComponentFixture<BackButtonComponent>;
  let history: jasmine.SpyObj<NavigationHistoryService>;

  beforeEach(async () => {
    history = jasmine.createSpyObj('NavigationHistoryService', ['back']);

    await TestBed.configureTestingModule({
      imports: [BackButtonComponent],
      providers: [{ provide: NavigationHistoryService, useValue: history }, provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(BackButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('goes back through the navigation history with the default URL as fallback', () => {
    component.defaultUrl = '/catalog';
    component.onBack();
    expect(history.back).toHaveBeenCalledWith('/catalog');
  });

  it('can hide the label', () => {
    component.showLabel = false;
    fixture.changeDetectorRef.markForCheck();
    fixture = TestBed.createComponent(BackButtonComponent);
    fixture.componentInstance.showLabel = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.back-label')).toBeNull();
  });
});
