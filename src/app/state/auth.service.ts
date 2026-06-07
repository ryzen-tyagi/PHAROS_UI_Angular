import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../core/api.service';
import { ModesService } from './modes.service';

/** = redux/slices/authSlice.js (signals). login chains fetchModes +
 *  changeMode("Maintenance"), exactly like the loginUser thunk. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private modes = inject(ModesService);

  user = signal<any>(null);
  token = signal<string | null>(localStorage.getItem('token'));
  loading = signal(false);
  error = signal<string | null>(null);
  message = signal<string | null>(null);

  async login(email: string, password: string): Promise<any> {
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    try {
      const data: any = await this.api.post('/v1/auth/login', { email, password });
      // SAVE TOKEN BEFORE ANY OTHER API REQUESTS
      localStorage.setItem('token', data.token);
      await this.modes.fetchModes();
      await this.modes.changeMode({ mode: 'Maintenance', reason: 'Default on login' });
      this.user.set(data.user);
      this.token.set(data.token);
      this.message.set(data.message);
      return data;
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Login failed');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  logout(): void {
    this.user.set(null);
    this.token.set(null);
    localStorage.removeItem('token');
  }

  clearMessages(): void {
    this.message.set(null);
    this.error.set(null);
  }
}
