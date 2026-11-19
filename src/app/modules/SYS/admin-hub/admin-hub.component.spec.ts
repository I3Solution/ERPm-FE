import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminHubComponent } from './admin-hub.component';
import { AuthService } from '../../../core/services/auth.service';
import { LocalizationService } from '../../../core/services/localization.service';
import { provideRouter, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';

describe('AdminHubComponent', () => {
  let component: AdminHubComponent;
  let fixture: ComponentFixture<AdminHubComponent>;
  let canSpy: jasmine.Spy;

  const mockLocalizationService = {
    translate: (key: string) => key,
    currentLang: () => 'vi'
  };

  beforeEach(async () => {
    canSpy = jasmine.createSpy('can').and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [AdminHubComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            can: canSpy,
            canAny: (actions: readonly string[]) => actions.some(a => canSpy(a))
          }
        },
        { provide: LocalizationService, useValue: mockLocalizationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminHubComponent);
    component = fixture.componentInstance;
  });

  it('should create the admin hub component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render all 4 core admin screens and extra screens when user has all permissions', () => {
    fixture.detectChanges();
    const cards = fixture.debugElement.queryAll(By.css('.hub-card'));
    expect(cards.length).toBe(7);

    const orgCard = fixture.debugElement.query(By.css('[data-testid="admin-card-org"]'));
    expect(orgCard).toBeTruthy();
    expect(orgCard.injector.get(RouterLink).href).toBe('/org');

    const deptLevelCard = fixture.debugElement.query(By.css('[data-testid="admin-card-department-levels"]'));
    expect(deptLevelCard).toBeTruthy();
    expect(deptLevelCard.injector.get(RouterLink).href).toBe('/department-levels');

    const jobPosCard = fixture.debugElement.query(By.css('[data-testid="admin-card-job-positions"]'));
    expect(jobPosCard).toBeTruthy();
    expect(jobPosCard.injector.get(RouterLink).href).toBe('/job-positions');

    const empCard = fixture.debugElement.query(By.css('[data-testid="admin-card-employees"]'));
    expect(empCard).toBeTruthy();
    expect(empCard.injector.get(RouterLink).href).toBe('/employees');

    const userCard = fixture.debugElement.query(By.css('[data-testid="admin-card-users"]'));
    expect(userCard).toBeTruthy();
    expect(userCard.injector.get(RouterLink).href).toBe('/users');

    const rolesCard = fixture.debugElement.query(By.css('[data-testid="admin-card-roles"]'));
    expect(rolesCard).toBeTruthy();
    expect(rolesCard.injector.get(RouterLink).href).toBe('/roles');
  });

  it('should only render screens permitted by auth.can()', () => {
    // Grant only organization and employees permissions
    canSpy.and.callFake((permission: string) => {
      return permission === 'hrm:employee:view';
    });

    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.css('.hub-card'));
    expect(cards.length).toBe(1);

    expect(fixture.debugElement.query(By.css('[data-testid="admin-card-employees"]'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('[data-testid="admin-card-org"]'))).toBeFalsy();
    expect(fixture.debugElement.query(By.css('[data-testid="admin-card-department-levels"]'))).toBeFalsy();
    expect(fixture.debugElement.query(By.css('[data-testid="admin-card-job-positions"]'))).toBeFalsy();
    expect(fixture.debugElement.query(By.css('[data-testid="admin-card-users"]'))).toBeFalsy();
    expect(fixture.debugElement.query(By.css('[data-testid="admin-card-roles"]'))).toBeFalsy();
  });

  it('should display empty state message when user has zero admin permissions', () => {
    canSpy.and.returnValue(false);
    fixture.detectChanges();

    const emptyBox = fixture.debugElement.query(By.css('.hub-empty-state'));
    expect(emptyBox).toBeTruthy();
    expect(emptyBox.nativeElement.textContent).toContain('admin_hub.empty');
  });
});
