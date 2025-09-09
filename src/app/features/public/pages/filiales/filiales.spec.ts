import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Filiales } from './filiales';

describe('Filiales', () => {
  let component: Filiales;
  let fixture: ComponentFixture<Filiales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Filiales]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Filiales);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
