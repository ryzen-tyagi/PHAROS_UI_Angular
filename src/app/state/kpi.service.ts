import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../core/api.service';

/** = redux/slices/pprSlice.js (the "kpi" slice). Live setters keep the same
 *  rolling caps (ppr 100, hrf 500). */
@Injectable({ providedIn: 'root' })
export class KpiService {
  private api = inject(ApiService);

  pprHistory = signal<any[]>([]);
  latestPpr = signal<any>(null);
  hrfHistory = signal<any[]>([]);
  latestHrf = signal<any>(null);
  tempHistory = signal<any[]>([]);
  latestTemp = signal<any>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  message = signal<string | null>(null);

  async fetchPprHistory(p: { fromDate: string; toDate: string; limit: number }): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const d: any = await this.api.get('/v1/ppr/latest', {
        from: p.fromDate, to: p.toDate, limit: p.limit,
      });
      this.pprHistory.set(d?.data || []);
      this.message.set(d?.message || 'PPR history fetched successfully');
    } catch (e: any) {
      this.error.set(e?.error?.message || 'Failed to fetch PPR history');
    } finally {
      this.loading.set(false);
    }
  }

  async fetchHrfHistory(p: { fromDate: string; toDate: string; limit: number }): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const d: any = await this.api.get('/v1/hrf/latest', {
        from: p.fromDate, to: p.toDate, limit: p.limit,
      });
      this.hrfHistory.set(d?.data || []);
      this.message.set(d?.message || 'HRF history fetched successfully');
    } catch (e: any) {
      this.error.set(e?.error?.message || 'Failed to fetch HRF history');
    } finally {
      this.loading.set(false);
    }
  }

  async fetchTempHistory(p: { number: number; fromDate: string; toDate: string; limit: number }): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const d: any = await this.api.get('/v1/sensor/latest', {
        sensor: `t${p.number}`, from: p.fromDate, to: p.toDate, limit: p.limit,
      });
      const arr = d?.data || [];
      this.tempHistory.set(arr);
      this.latestTemp.set(arr[arr.length - 1] || null);
      this.message.set(d?.message || 'Temperature history fetched successfully');
    } catch (e: any) {
      this.error.set(e?.error?.message || 'Failed to fetch Temperature history');
    } finally {
      this.loading.set(false);
    }
  }

  setLivePprData(payload: any): void {
    this.latestPpr.set(payload);
    this.pprHistory.update((a) => {
      const n = [...a, payload];
      if (n.length > 100) n.shift();
      return n;
    });
  }

  setLiveHrfData(payload: any): void {
    this.latestHrf.set(payload);
    this.hrfHistory.update((a) => {
      const n = [...a, payload];
      if (n.length > 500) n.shift();
      return n;
    });
  }

  clearPowerData(): void {
    this.pprHistory.set([]);
    this.hrfHistory.set([]);
    this.tempHistory.set([]);
    this.latestPpr.set(null);
    this.latestHrf.set(null);
    this.latestTemp.set(null);
  }
}
