import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuiderDashboard } from './guider-dashboard';

describe('GuiderDashboard', () => {
  let component: GuiderDashboard;
  let fixture: ComponentFixture<GuiderDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuiderDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuiderDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
