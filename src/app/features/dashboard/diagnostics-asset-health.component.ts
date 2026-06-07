import {
  Component,
  inject,
  signal,
  input,
  computed,
  OnDestroy,
  effect,
} from '@angular/core';
import { LucideAngularModule, Maximize } from 'lucide-angular';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { Socket } from 'socket.io-client';
import { SocketService } from '../../core/socket.service';
import { KpiService } from '../../state/kpi.service';
import { modeStyles } from '../../shared/util/helper';

interface ChartPoint {
  timestamp: string;
  value: number;
}

/** Port of components/DiagnosticsAssetHealth.jsx */
@Component({
  selector: 'app-diagnostics-asset-health',
  standalone: true,
  imports: [LucideAngularModule, HighchartsChartModule],
  template: `
    <div class="bg-[#181818] rounded-lg w-[34.7vw] p-[8px] flex flex-col h-[31.9vh]">
      <!-- Header -->
      <div class="flex justify-between items-center mb-2 shrink-0">
        <h3 class="text-white text-base font-semibold">
          Diagnostics & Asset Health
        </h3>

        <div class="flex items-center gap-2">
          <!-- Sensor Dropdown -->
          <select
            [value]="tracking()"
            (change)="tracking.set($any($event.target).value)"
            class="bg-transparent border border-[#FFFFFF] text-xs w-[200px] h-[27px] rounded px-2 text-white"
          >
            @for (key of sensorKeys; track key) {
              <option class="text-black" [value]="key">{{ key }}</option>
            }
          </select>

          <!-- Expand -->
          <button
            (click)="expanded.set(true)"
            class="text-[#00A6E2] hover:text-[#2CC3FF] transition-colors"
            title="Expand"
          >
            <lucide-icon [img]="Maximize" [size]="20"></lucide-icon>
          </button>
        </div>
      </div>

      <!-- Chart -->
      <div class="border border-[#5E5E5E] rounded-lg bg-transparent p-2 flex-1 overflow-hidden">
        @if (chartData().length === 0) {
          <div class="text-gray-400 flex justify-center items-center flex-1">
            {{ currentMode() === 'Simulation'
              ? 'Connecting to Simulation Stream...'
              : 'Loading ' + currentMode() + ' Data...' }}
          </div>
        } @else {
          <highcharts-chart
            [Highcharts]="Highcharts"
            [options]="chartOptions()"
            [style.height]="height()"
            [style.width]="width()"
            style="display: block;"
          ></highcharts-chart>
        }
      </div>

      <!-- Expanded View -->
      @if (expanded()) {
        <div
          class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          (click)="expanded.set(false)"
        >
          <div
            class="relative bg-black/90 border-2 border-[#00A1FF]/50 rounded-2xl w-[95vw] h-[90vh] p-4"
            (click)="$event.stopPropagation()"
          >
            <div class="flex w-full justify-center gap-20">
              <!-- Title -->
              <h2 class="text-white text-xl">{{ tracking() }}</h2>
              <!-- Mode Tag -->
              <div class="flex justify-end">
                <span
                  class="rounded-lg px-3 py-1 text-sm font-medium"
                  [class]="modeTagClass()"
                >
                  ● {{ currentMode() }} Mode
                </span>
              </div>
              <!-- Close Button -->
              <button
                (click)="expanded.set(false)"
                class="absolute right-4 top-2 text-white text-2xl hover:text-[#00A1FF]"
              >
                ×
              </button>
            </div>
            <!-- Dropdown -->
            <div class="flex justify-end w-full items-center mb-4">
              <select
                [value]="tracking()"
                (change)="tracking.set($any($event.target).value)"
                class="bg-transparent border border-[#FFFFFF] text-sm rounded px-3 py-1 text-white w-[230px] h-[32px]"
              >
                @for (key of sensorKeys; track key) {
                  <option class="text-black" [value]="key">{{ key }}</option>
                }
              </select>
            </div>

            <!-- Expanded Chart -->
            <highcharts-chart
              [Highcharts]="Highcharts"
              [options]="chartOptions()"
              style="display: block; height: 95%; width: 100%;"
            ></highcharts-chart>
          </div>
        </div>
      }
    </div>
  `,
})
export class DiagnosticsAssetHealthComponent implements OnDestroy {
  height = input<string>('');
  width = input<string>('');
  currentMode = input<string>('');
  fontSize = input<string>('');
  simulationStatus = input<boolean>(false);

  private socketSvc = inject(SocketService);
  private kpiSvc = inject(KpiService);
  private socket?: Socket;

  protected readonly Maximize = Maximize;
  protected readonly Highcharts: typeof Highcharts = Highcharts;

  tracking = signal('Temperature Sensor T1');
  expanded = signal(false);
  chartData = signal<ChartPoint[]>([]);

  // guards for "initial snapshot" issue on socket connect
  private skipNextLive = false;
  private historyLoaded = false;

  private tempHistory = this.kpiSvc.tempHistory;

  readonly sensorMap: Record<string, number> = {
    'Temperature Sensor T1': 1,
    'Temperature Sensor T2': 2,
    'Temperature Sensor T3': 3,
    'Temperature Sensor T4': 4,
  };
  readonly sensorKeys = Object.keys(this.sensorMap);

  modeTagClass(): string {
    const s = modeStyles[this.currentMode()];
    return s ? `${s.text} ${s.border} ${s.bg}` : '';
  }

  constructor() {
    // 1) Clear chart immediately on sensor change (prevents mixing)
    effect(() => {
      this.tracking();
      this.chartData.set([]);
    });

    // 2) Fetch Live Historical Data (last 24h) when not Simulation
    effect(() => {
      const mode = this.currentMode();
      const track = this.tracking();
      if (mode !== 'Simulation') {
        const to = new Date();
        const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
        this.kpiSvc.fetchTempHistory({
          number: this.sensorMap[track],
          fromDate: from.toISOString(),
          toDate: to.toISOString(),
          limit: 500,
        });
      }
    });

    // 3) Apply Live tempHistory -> keep last 5 only
    effect(() => {
      const mode = this.currentMode();
      const hist = this.tempHistory();
      if (mode !== 'Simulation' && hist?.length > 0) {
        const formatted: ChartPoint[] = hist.map((d: any) => ({
          timestamp: d.timestamp_iso,
          value: parseFloat(d.value),
        }));
        this.chartData.set(formatted.slice(-5));
      }
    });

    // 4) WebSocket (Simulation & Live) with skip-first-live + gating
    effect(() => {
      const mode = this.currentMode();
      const track = this.tracking();
      this.teardownSocket();

      const socket = this.socketSvc.connect();
      this.socket = socket;

      socket.on('connect', () => {
        // on each (re)connect, skip next live tick; in Live, allow live immediately
        this.skipNextLive = true;
        this.historyLoaded = mode !== 'Simulation';
      });

      socket.on('sensorHistoricalData', (data: any) => {
        if (mode === 'Simulation' && data?.data?.length) {
          const sensorKey = `t${this.sensorMap[track]}`;
          const formatted: ChartPoint[] = data.data.map((d: any) => ({
            timestamp: d.timestamp,
            value: parseFloat(d[sensorKey] || 0),
          }));
          this.historyLoaded = true;
          this.chartData.set(formatted.slice(-5));
        }
      });

      socket.on('sensorData', (data: any) => {
        // 1) hard-skip the first live message after connect
        if (this.skipNextLive) {
          this.skipNextLive = false;
          return;
        }
        // 2) ignore live ticks until history is set (Simulation)
        if (!this.historyLoaded) return;

        const sensorKey = `t${this.sensorMap[track]}`;
        const newPoint: ChartPoint = {
          timestamp: data?.timestamp,
          value: parseFloat(data?.[sensorKey] || 0),
        };

        this.chartData.update((prev) => {
          const newTs = new Date(newPoint.timestamp).getTime();
          const lastTs = prev.length
            ? new Date(prev[prev.length - 1].timestamp).getTime()
            : -Infinity;

          // ignore duplicates/out-of-order by timestamp
          if (newTs <= lastTs) return prev;

          const updated = [...prev, newPoint];
          return updated.slice(-5);
        });
      });

      if (mode === 'Simulation') {
        socket.emit('getSensorHistory', { type: 'sensorHistoricalData' });
      }
    });
  }

  // Series + exact tick positions for these points (PST offset -8h)
  private seriesData = computed<[number, number][]>(() =>
    this.chartData().map((d) => {
      const utcTime = new Date(d.timestamp).getTime();
      const pstTime = utcTime - 8 * 60 * 60 * 1000;
      return [pstTime, d.value];
    })
  );

  chartOptions = computed<Highcharts.Options>(() => {
    const series = this.seriesData();
    const tickPositions = series.map((p) => p[0]);
    const textStyle = { color: '#fff', fontSize: this.fontSize() };
    const mode = this.currentMode();

    return {
      chart: {
        backgroundColor: 'transparent',
        animation: mode === 'Simulation',
        spacingTop: 10,
        spacingBottom: 5,
        spacingLeft: 0,
        spacingRight: 10,
      },
      title: { text: undefined },
      xAxis: {
        type: 'datetime',
        ordinal: false,
        tickPositions,
        tickmarkPlacement: 'on',
        startOnTick: false,
        endOnTick: false,
        labels: { style: textStyle, format: '{value:%H:%M:%S}', rotation: -30 },
        title: { text: 'Timeline', style: textStyle },
        gridLineColor: '#fff',
        lineColor: '#fff',
        tickColor: '#fff',
      },
      yAxis: {
        title: { text: 'Temperature (°C)', style: textStyle },
        labels: {
          style: textStyle,
          formatter: function (this: any) {
            return this.value.toFixed(2);
          },
        },
        gridLineColor: '#fff',
        min: 65,
        max: 80,
      },
      legend: { enabled: true, itemStyle: textStyle },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.9)',
        borderColor: '#4da6ff',
        borderRadius: 6,
        style: textStyle,
        formatter: function (this: any) {
          return `
          <b>${Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x)}</b><br/>
          Temperature: <span style="color:#ff6b6b">${this.y.toFixed(2)}°C</span>
        `;
        },
      },
      series: [
        {
          name: this.tracking(),
          data: series,
          type: 'spline',
          color: '#FFEF10',
          lineWidth: 2.5,
          marker: { enabled: true },
        } as Highcharts.SeriesSplineOptions,
      ],
      credits: { enabled: false },
    };
  });

  private teardownSocket(): void {
    if (this.socket) {
      this.socket.off('sensorData');
      this.socket.off('sensorHistoricalData');
      this.socket.disconnect();
      this.socket = undefined;
    }
  }

  ngOnDestroy(): void {
    this.teardownSocket();
  }
}
