import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { KpiService } from './kpi.service';

describe('KpiService (pure logic)', () => {
  let service: KpiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(KpiService);
  });

  it('setLivePprData caps pprHistory at 100 and tracks latestPpr', () => {
    for (let i = 0; i < 105; i++) service.setLivePprData({ v: i });
    expect(service.pprHistory().length).toBe(100);
    expect(service.latestPpr()).toEqual({ v: 104 });
    // oldest entries shifted off
    expect(service.pprHistory()[0]).toEqual({ v: 5 });
  });

  it('setLiveHrfData caps hrfHistory at 500 and tracks latestHrf', () => {
    for (let i = 0; i < 505; i++) service.setLiveHrfData({ v: i });
    expect(service.hrfHistory().length).toBe(500);
    expect(service.latestHrf()).toEqual({ v: 504 });
    expect(service.hrfHistory()[0]).toEqual({ v: 5 });
  });

  it('clearPowerData empties all histories and nulls latest values', () => {
    service.setLivePprData({ v: 1 });
    service.setLiveHrfData({ v: 2 });
    service.tempHistory.set([{ v: 3 }]);
    service.latestTemp.set({ v: 3 });

    service.clearPowerData();

    expect(service.pprHistory()).toEqual([]);
    expect(service.hrfHistory()).toEqual([]);
    expect(service.tempHistory()).toEqual([]);
    expect(service.latestPpr()).toBeNull();
    expect(service.latestHrf()).toBeNull();
    expect(service.latestTemp()).toBeNull();
  });
});
