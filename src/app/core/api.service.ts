import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

/** Thin HttpClient wrapper (= redux/api/Client.js baseURL). The Bearer token and
 *  401-logout are handled by authInterceptor. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.API_BASE;

  get<T = any>(path: string, params?: Record<string, unknown>): Promise<T> {
    let hp = new HttpParams();
    if (params) {
      for (const k of Object.keys(params)) {
        const v = params[k];
        if (v !== undefined && v !== null) hp = hp.set(k, String(v));
      }
    }
    return firstValueFrom(this.http.get<T>(this.base + path, { params: hp }));
  }

  post<T = any>(path: string, body?: unknown): Promise<T> {
    return firstValueFrom(this.http.post<T>(this.base + path, body ?? {}));
  }
}
