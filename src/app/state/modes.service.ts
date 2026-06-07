import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../core/api.service';
import { ModeChannelService } from '../core/mode-channel.service';

/** = redux/slices/modesSlice.js (signals instead of Redux). */
@Injectable({ providedIn: 'root' })
export class ModesService {
  private api = inject(ApiService);
  private modeChannel = inject(ModeChannelService);

  list = signal<any[]>([]);
  current = signal<string | null>(null);
  simulationStatus = signal<boolean | null>(null);
  simulationStartStatus = signal<boolean | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  message = signal<string | null>(null);

  async fetchModes(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    try {
      const d: any = await this.api.get('/v1/modes/get-all-modes');
      this.list.set(d.modes || []);
      this.message.set(d.message || 'Modes fetched successfully');
    } catch (e: any) {
      this.error.set(e?.error?.message || 'Failed to fetch modes');
    } finally {
      this.loading.set(false);
    }
  }

  async fetchCurrentModes(): Promise<void> {
    this.loading.set(true);
    try {
      const d: any = await this.api.get('/v1/modes/current-mode');
      this.current.set(d.current || null);
      this.simulationStartStatus.set(d.sim_running ?? null);
      this.message.set(d.message || 'Current mode fetched successfully');
    } catch (e: any) {
      this.error.set(e?.error?.message || 'Failed to fetch current mode');
    } finally {
      this.loading.set(false);
    }
  }

  async changeMode(arg: { mode: string; reason?: string; note?: string }): Promise<any> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const d: any = await this.api.post('/v1/modes/change-mode', {
        mode: arg.mode,
        reason: arg.reason ?? '',
        note: arg.note ?? '',
      });
      // Backend returns {current}; React reads payload.newMode || arg.mode.
      const cur = d.newMode || arg.mode;
      this.current.set(cur);
      this.message.set(d.message || `Mode changed to ${cur}`);
      this.modeChannel.post(cur);
      return d;
    } catch (e: any) {
      this.error.set(e?.error?.message || 'Failed to change mode');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  async simulationStartAndStop(action: 'start' | 'stop'): Promise<any> {
    this.loading.set(true);
    try {
      const d: any = await this.api.post(`/api/simulation/${action}`);
      this.simulationStatus.set(d.running);
      this.message.set(d.message);
      return d;
    } catch (e: any) {
      this.error.set(e?.error?.message || 'Simulation start/stop failed');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  async fetchSimulationStatus(): Promise<void> {
    this.loading.set(true);
    try {
      const d: any = await this.api.get('/api/simulation/status');
      this.simulationStatus.set(d.running);
      this.message.set(d.message || 'Status fetched successfully');
    } catch (e: any) {
      this.error.set(e?.error?.message || 'Failed to fetch simulation status');
    } finally {
      this.loading.set(false);
    }
  }
}
