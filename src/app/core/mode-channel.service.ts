import { Injectable } from '@angular/core';

/** Cross-tab mode sync (= utils/modeChannel.js). */
@Injectable({ providedIn: 'root' })
export class ModeChannelService {
  private channel = new BroadcastChannel('mode_channel');

  post(mode: string): void {
    this.channel.postMessage({ type: 'MODE_CHANGED', mode });
  }

  /** Subscribe to MODE_CHANGED messages; returns an unsubscribe fn. */
  onMessage(cb: (data: { type: string; mode: string }) => void): () => void {
    const handler = (e: MessageEvent) => cb(e.data);
    this.channel.addEventListener('message', handler);
    return () => this.channel.removeEventListener('message', handler);
  }
}
