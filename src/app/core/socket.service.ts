import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

/** Wraps socket.io-client. The React app creates a NEW socket per chart
 *  component; mirror that by returning a fresh Socket from connect(). The
 *  component owns the lifecycle (disconnect in ngOnDestroy). */
@Injectable({ providedIn: 'root' })
export class SocketService {
  /** Default opts force websocket transport (HRF/PPR/TES/Diagnostics/KPIs use
   *  this); SystemFlow passes `{}` to allow polling-upgrade. */
  connect(opts: Partial<Parameters<typeof io>[1]> = { transports: ['websocket'] }): Socket {
    return io(environment.WS_BASE, opts as any);
  }
}
