import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TouristDashboard } from './tourist-dashboard';

describe('TouristDashboard', () => {
  let component: TouristDashboard;
  let fixture: ComponentFixture<TouristDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TouristDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TouristDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
