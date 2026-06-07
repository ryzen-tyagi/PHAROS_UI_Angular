import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpeedometerGaugeComponent } from './speedometer-gauge.component';

describe('SpeedometerGaugeComponent', () => {
  let fixture: ComponentFixture<SpeedometerGaugeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpeedometerGaugeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpeedometerGaugeComponent);
    const ref = fixture.componentRef;
    ref.setInput('title', 'Power');
    ref.setInput('value', 50);
    ref.setInput('minValue', 0);
    ref.setInput('maxValue', 100);
    ref.setInput('pointerValue', 50);
    ref.setInput('gradient', [
      [0, '#06B211'],
      [1, '#06B211'],
    ]);
    ref.setInput('height', '200px');
    ref.setInput('width', '200px');
    ref.setInput('fontSize', '12px');
    ref.setInput('unit', 'kW');
  });

  it('creates the component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a <highcharts-chart> element', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('highcharts-chart');
    expect(el).toBeTruthy();
  });
});
