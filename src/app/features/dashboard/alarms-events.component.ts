import { Component, signal, input, computed, OnDestroy, effect } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { LucideAngularModule, Maximize } from 'lucide-angular';

interface Alarm {
  id: string;
  subsystem: string;
  description: string;
  severity: string;
  status: string;
  timestampPST: string;
  ts: number;
}

interface EventItem {
  text: string;
  time: string;
}

/** Very simple CSV parser (no quoted commas) */
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = cells[i] ?? '';
    });
    return obj;
  });
}

/** Convert UTC Date -> PST (fixed UTC-8) string "YYYY-MM-DD HH:mm:ss" */
function toPSTString(date: Date | null): string {
  if (!date) return '';
  const pst = new Date(date.getTime() - 8 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = pst.getUTCFullYear();
  const MM = pad(pst.getUTCMonth() + 1);
  const dd = pad(pst.getUTCDate());
  const hh = pad(pst.getUTCHours());
  const mm = pad(pst.getUTCMinutes());
  const ss = pad(pst.getUTCSeconds());
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
}

/** storage helpers for "last timestamps" */
const STORAGE_KEY = 'alarms_last_ts_map';
const STORAGE_SIM_CURSOR = 'alarms_sim_cursor';
const STORAGE_SIM_LIST = 'alarms_sim_list';

function readLastTsMap(): Record<string, { ts: number; timestampPST: string }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function writeLastTsMap(mapObj: any): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapObj));
  } catch {}
}

function readSimCursor(): number {
  try {
    const raw = localStorage.getItem(STORAGE_SIM_CURSOR);
    const n = raw != null ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}
function writeSimCursor(n: number): void {
  try {
    localStorage.setItem(STORAGE_SIM_CURSOR, String(n));
  } catch {}
}

function readSimList(): Alarm[] {
  try {
    const raw = localStorage.getItem(STORAGE_SIM_LIST);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function writeSimList(arr: Alarm[]): void {
  try {
    localStorage.setItem(STORAGE_SIM_LIST, JSON.stringify(arr));
  } catch {}
}

const severityColor: Record<string, string> = {
  Critical: 'text-red-600',
  Major: 'text-red-500',
  Warning: 'text-orange-500',
  Minor: 'text-yellow-500',
  default: 'text-gray-300',
};

/** Port of components/AlarmsEvents.jsx */
@Component({
  selector: 'app-alarms-events',
  standalone: true,
  imports: [LucideAngularModule, NgTemplateOutlet],
  template: `
    <!-- Main Section -->
    <div class="bg-[#181818] rounded-lg w-[40.5vw] p-[8px] flex flex-col h-[31.9vh]">
      <div class="flex justify-between items-center mb-2 shrink-0">
        <h3 class="text-white text-base font-semibold">Alarms & Events</h3>
        <button
          class="text-[#00A6E2] hover:text-cyan-400 transition-colors"
          (click)="expanded.set(true)"
        >
          <lucide-icon [img]="Maximize" [size]="20"></lucide-icon>
        </button>
      </div>
      <div class="flex-1 overflow-hidden">
        <ng-container *ngTemplateOutlet="content; context: { isExpanded: false }"></ng-container>
      </div>
    </div>

    <!-- Expanded Modal -->
    @if (expanded()) {
      <div
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        (click)="expanded.set(false)"
      >
        <div
          class="relative bg-black/90 backdrop-blur-lg border-2 border-[#00A1FF]/50 rounded-2xl w-[95vw] h-[90vh] p-6 overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <button
            (click)="expanded.set(false)"
            class="absolute top-3 right-3 text-white text-3xl hover:text-[#00A6E2] transition-colors duration-200 z-10 bg-[#1a1a1a]/80 rounded-full w-8 h-8 flex items-center text-center justify-center border border-[#00A6E2]/50 hover:bg-[#00A6E2]/20"
          >
            <span class="mb-1 ">×</span>
          </button>
          <h2 class="text-white text-base mb-4">Alarms & Events</h2>
          <div class="h-[calc(100%-4rem)]">
            <ng-container *ngTemplateOutlet="content; context: { isExpanded: true }"></ng-container>
          </div>
        </div>
      </div>
    }

    <!-- Shared content template -->
    <ng-template #content let-isExpanded="isExpanded">
      <div class="flex gap-3 h-full">
        <!-- Alarms Table -->
        <div class="border border-[#5E5E5E] rounded-lg flex flex-col flex-1 bg-transparent">
          <div class="flex-1 overflow-auto custom-scroll">
            <table class="w-full text-xs border-collapse text-center rounded-md">
              <thead class="sticky top-0 bg-[#181818] z-10 rounded-lg">
                <tr class="border-b border-[#5E5E5E] h-[5vh]">
                  <th class="p-2 text-white border-r border-[#5E5E5E]">TIME</th>
                  <th class="p-2 text-white border-r text-nowrap border-[#5E5E5E]">ALARM ID</th>
                  <th class="p-2 text-white border-r border-[#5E5E5E]">SUBSYSTEM</th>
                  <th class="p-2 text-white border-r border-[#5E5E5E]">DESCRIPTION</th>
                  <th class="p-2 text-white border-r border-[#5E5E5E]">PRIORITY</th>
                </tr>
              </thead>

              <tbody>
                @for (alarm of sortedAlarms(); track $index) {
                  <tr class="border-b border-[#5E5E5E] last:border-b-0 h-[4.8vh]">
                    <td class="p-2 text-white border-r border-[#5E5E5E]">{{ alarm.timestampPST }}</td>
                    <td class="p-2 text-white border-r border-[#5E5E5E]">{{ alarm.id }}</td>
                    <td class="p-2 text-white border-r border-[#5E5E5E]">{{ alarm.subsystem }}</td>
                    <td class="p-2 text-white border-r border-[#5E5E5E]">{{ alarm.description }}</td>
                    <td class="p-2 font-semibold border-r border-[#5E5E5E]" [class]="severityClass(alarm.severity)">
                      {{ alarm.severity }}
                    </td>
                  </tr>
                }

                @if (!isSimulation() && !isLive()) {
                  <tr>
                    <td colspan="6" class="p-3 text-gray-400 text-left">
                      Start Simulation or Live Mode to see Alarms feed.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Events Timeline -->
        <div
          class="border border-[#5E5E5E] rounded-lg p-3 flex flex-col bg-transparent"
          [class]="isExpanded ? 'w-[25%]' : 'w-[16.5vw]'"
        >
          <h4 class="text-white text-base font-semibold mb-2">Event Timeline</h4>
          <div class="flex-1 overflow-y-auto space-y-4 custom-scroll">
            @for (event of events; track $index) {
              <div class="flex items-start gap-2">
                <div class="flex flex-col items-center">
                  <div class="w-2 h-2 bg-[#00A6E2] rounded-full"></div>
                  <div class="w-[1px] h-6 bg-[#6E6E6E] my-[1px]"></div>
                </div>
                <div>
                  <p class="text-white text-xs">{{ event.text }}</p>
                  <p class="text-gray-500 text-xs">{{ event.time }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </ng-template>
  `,
})
export class AlarmsEventsComponent implements OnDestroy {
  currentMode = input<string>('');

  protected readonly Maximize = Maximize;

  expanded = signal(false);
  alarms = signal<Alarm[]>([]);

  private feedTimer?: any;
  private cursor = 0;
  private destroyed = false;
  private liveCanceled = false;
  private readonly CSV_URL = '/assets/alarms.csv';

  isSimulation = computed(() => (this.currentMode() || '').toLowerCase() === 'simulation');
  isLive = computed(() => (this.currentMode() || '').toLowerCase() === 'live');

  // keep latest-first
  sortedAlarms = computed(() => [...this.alarms()].sort((a, b) => b.ts - a.ts));

  events: EventItem[] = [
    { text: 'Mode Change: Cooling → Idle', time: '10:12 AM' },
    { text: 'Trip Reset: Chiller-2 Restarted', time: '10:18 AM' },
    { text: 'Operator Acknowledged Alarm', time: '10:22 AM' },
  ];

  severityClass(severity: string): string {
    return severityColor[severity] || severityColor['default'];
  }

  constructor() {
    // SIMULATION effect: stream CSV, save last timestamps
    effect(() => {
      const sim = this.isSimulation();
      // cleanup previous timer (mirrors React effect cleanup)
      if (this.feedTimer) {
        clearInterval(this.feedTimer);
        this.feedTimer = null;
      }
      if (!sim) return;

      this.destroyed = false;
      let baseData: Record<string, string>[] = [];

      (async () => {
        try {
          const res = await fetch(this.CSV_URL, { cache: 'no-store' });
          const text = await res.text();
          baseData = parseCSV(text);

          // Sort by Alarm ID numeric part if present
          baseData.sort((a, b) => {
            const A = parseInt(a['Alarm ID']?.replace(/\D/g, '')) || 0;
            const B = parseInt(b['Alarm ID']?.replace(/\D/g, '')) || 0;
            return A - B;
          });

          // restore simulation cursor + list so it persists across refresh
          const savedCursor = readSimCursor();
          this.cursor = baseData.length ? savedCursor % baseData.length : 0;

          const savedList = readSimList();
          if (Array.isArray(savedList) && savedList.length) {
            this.alarms.set(savedList);
          }

          // stream a new row every 10 seconds
          this.feedTimer = setInterval(() => {
            if (this.destroyed || baseData.length === 0) return;

            const i = this.cursor % baseData.length;
            const row = baseData[i];
            this.cursor += 1;

            const now = new Date();
            const ts = now.getTime();
            const timestampPST = toPSTString(now);

            const entry: Alarm = {
              id: row['Alarm ID'],
              subsystem: row['Subsystem'],
              description: row['Alarm Description'],
              severity: row['Priority'],
              status: row['Status'],
              timestampPST,
              ts,
            };

            // update UI list
            this.alarms.update((prev) => {
              const next = [entry, ...prev];
              if (next.length > 100) next.pop();
              writeSimList(next);
              return next;
            });

            // persist "last timestamps" by Alarm ID
            if (entry.id) {
              const map = readLastTsMap();
              map[entry.id] = { ts, timestampPST };
              writeLastTsMap(map);
            }

            // persist updated cursor so we continue after refresh
            writeSimCursor(this.cursor);
          }, 10000);
        } catch (err) {
          console.error('Failed to read alarms CSV (Simulation):', err);
        }
      })();
    });

    // LIVE effect: show latest CSV rows with their "last timestamps"
    effect(() => {
      const live = this.isLive();
      if (!live) return;

      this.liveCanceled = false;

      (async () => {
        try {
          const res = await fetch(this.CSV_URL, { cache: 'no-store' });
          const text = await res.text();
          const rows = parseCSV(text);

          // latest by Alarm ID numeric
          rows.sort((a, b) => {
            const A = parseInt(a['Alarm ID']?.replace(/\D/g, '')) || 0;
            const B = parseInt(b['Alarm ID']?.replace(/\D/g, '')) || 0;
            return B - A;
          });

          const lastMap = readLastTsMap();

          // fallback timestamps (fixed, no streaming) so table isn't empty
          const now = Date.now();
          const fallbackGapMs = 60 * 1000;
          const computed: Alarm[] = rows.slice(0, 50).map((row, idx) => {
            const id = row['Alarm ID'];
            const stored = id ? lastMap[id] : null;

            let ts: number;
            let timestampPST: string;
            if (stored?.ts && stored?.timestampPST) {
              ts = stored.ts;
              timestampPST = stored.timestampPST;
            } else {
              ts = now - idx * fallbackGapMs;
              timestampPST = toPSTString(new Date(ts));
            }

            return {
              id,
              subsystem: row['Subsystem'],
              description: row['Alarm Description'],
              severity: row['Priority'],
              status: row['Status'],
              ts,
              timestampPST,
            };
          });

          if (!this.liveCanceled) {
            computed.sort((a, b) => b.ts - a.ts);
            this.alarms.set(computed);
          }
        } catch (err) {
          console.error('Failed to read alarms CSV (Live):', err);
        }
      })();
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.liveCanceled = true;
    if (this.feedTimer) {
      clearInterval(this.feedTimer);
      this.feedTimer = null;
    }
  }
}
