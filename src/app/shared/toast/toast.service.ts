import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

/** Minimal react-hot-toast equivalent (top-center, auto-dismiss). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private nextId = 1;

  success(message: string) {
    this.push('success', message);
  }
  error(message: string) {
    this.push('error', message);
  }

  private push(type: Toast['type'], message: string) {
    const id = this.nextId++;
    this.toasts.update((t) => [...t, { id, type, message }]);
    setTimeout(() => this.dismiss(id), 4000);
  }

  dismiss(id: number) {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }
}
