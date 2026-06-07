import { Injectable, signal } from '@angular/core';

/** = context/DashboardContext.jsx — local UI mode display, default "Live". */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  mode = signal<string>('Live');
  setMode(m: string): void {
    this.mode.set(m);
  }
}
