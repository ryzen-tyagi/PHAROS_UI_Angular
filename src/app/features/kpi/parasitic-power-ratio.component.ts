import {
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import type { Socket } from 'socket.io-client';
import { SocketService } from '../../core/socket.service';
import { KpiService } from '../../state/kpi.service';

interface PprPoint {
  orc: number;
  parasitic: number;
  net: number;
  timestamp: string | number;
}

/** Port of KPIs/ParasiticPowerRatio.jsx (PprGraph). */
@Component({
  selector: 'app-parasitic-power-ratio',
  standalone: true,
  imports: [HighchartsChartModule],
  template: `
    @if (chartData().length === 0) {
      <div class="text-white p-8 h-full w-full flex items-center justify-center">
        {{
          currentMode() === 'Simulation'
            ? 'Connecting to PPR Simulation Stream...'
            : 'Loading Live PPR Data...'
        }}
      </div>
    } @else {
      <highcharts-chart
        [Highcharts]="Highcharts"
        [options]="chartOptions()"
        [style.height]="height()"
        [style.width]="width()"
        [style.fontSize]="fontSize()"
        style="display:block"
      ></highcharts-chart>
    }
  `,
})
export class ParasiticPowerRatioComponent implements OnDestroy {
  private socketSvc = inject(SocketService);
  private kpi = inject(KpiService);

  Highcharts: typeof Highcharts = Highcharts;

  height = input<string>('');
  width = input<string>('');
  fontSize = input<string>('');
  currentMode = input<string>('');

  chartData = signal<PprPoint[]>([]);

  private socket: Socket | null = null;

  // guards for the "first live tick on connect" issue
  private skipNextLive = false;
  private historyLoaded = false;

  constructor() {
    /** 2) Apply Redux Data (Live) -> keep last 15 */
    effect(() => {
      const pprHistory = this.kpi.pprHistory();
      if (
        this.currentMode() !== 'Simulation' &&
        Array.isArray(pprHistory) &&
        pprHistory.length > 0
      ) {
        const formatted: PprPoint[] = pprHistory.map((d: any) => ({
          orc: parseFloat(d.orc_generated_power || 0),
          parasitic: parseFloat(d.parasitic_power || 0),
          net: parseFloat(d.net_power_generated || 0),
          timestamp: d.timestamp_iso,
        }));
        this.chartData.set(formatted.slice(-15));
      }
    });

    /** Mode-reactive: (re)wire socket / live fetch whenever currentMode changes. */
    effect(() => {
      const mode = this.currentMode();

      // Always tear down any prior socket before re-evaluating.
      this.teardownSocket();

      /** 1) Fetch Live Historical Data */
      if (mode !== 'Simulation') {
        const to = new Date();
        const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
        this.kpi.fetchPprHistory({
          limit: 500,
          fromDate: from.toISOString(),
          toDate: to.toISOString(),
        });
        return;
      }

      /** 3) Simulation Mode — historical + live */
      this.skipNextLive = true;
      this.historyLoaded = false;

      const socket = this.socketSvc.connect();
      this.socket = socket;

      socket.on('connect', () => {
        // on each (re)connect, ignore the first live tick — but do NOT reset
        // historyLoaded (a flaky reconnect would otherwise gate out all live
        // ticks since history isn't re-sent).
        this.skipNextLive = true;
      });

      socket.on('pprHistoricalData', (data: any) => {
        if (data?.data?.length) {
          const formatted: PprPoint[] = data.data.map((d: any) => ({
            orc: parseFloat(d.orc_generated_power || 0),
            parasitic: parseFloat(d.parasitic_power || 0),
            net: parseFloat(d.net_power_generated || 0),
            timestamp: d.timestamp,
          }));
          this.chartData.set(formatted.slice(-15));
          this.historyLoaded = true;
        }
      });

      socket.on('pprData', (data: any) => {
        // 1) hard-skip the very first live message after connect
        if (this.skipNextLive) {
          this.skipNextLive = false;
          return;
        }
        // 2) ignore lives until history is set
        if (!this.historyLoaded) return;

        const newPoint: PprPoint = {
          orc: parseFloat(data?.orc_generated_power || 0),
          parasitic: parseFloat(data?.parasitic_power || 0),
          net: parseFloat(data?.net_power_generated || 0),
          timestamp: data?.timestamp || Date.now(),
        };

        this.chartData.update((prev) => {
          const newTs = new Date(newPoint.timestamp).getTime();
          const lastTs = prev.length
            ? new Date(prev[prev.length - 1].timestamp).getTime()
            : -Infinity;

          // ignore duplicates/out-of-order
          if (newTs <= lastTs) return prev;

          const updated = [...prev, newPoint];
          return updated.slice(-15);
        });
      });

      // request initial historical data
      socket.emit('getSensorHistory', { type: 'pprHistoricalData' });
    });
  }

  ngOnDestroy(): void {
    this.teardownSocket();
  }

  private teardownSocket(): void {
    if (this.socket) {
      this.socket.off('pprData');
      this.socket.off('pprHistoricalData');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /** 4) PST conversion */
  private toPstMs(ts: string | number): number {
    const utc = new Date(ts).getTime();
    return utc - 8 * 60 * 60 * 1000;
  }

  chartOptions = computed<Highcharts.Options>(() => {
    const chartData = this.chartData();
    const fontSize = this.fontSize();
    const currentMode = this.currentMode();

    const orcSeries = chartData.map((d) => [this.toPstMs(d.timestamp), d.orc]);
    const parasiticSeries = chartData.map((d) => [this.toPstMs(d.timestamp), d.parasitic]);
    const netSeries = chartData.map((d) => [this.toPstMs(d.timestamp), d.net]);

    // ensure ascending by time
    const sortByX = (a: number[], b: number[]) => a[0] - b[0];
    orcSeries.sort(sortByX);
    parasiticSeries.sort(sortByX);
    netSeries.sort(sortByX);

    const tickPositions = orcSeries.map((p) => p[0]);
    const textStyle = { color: '#fff', fontSize };

    const options: Highcharts.Options = {
      chart: {
        type: 'spline',
        backgroundColor: undefined,
        animation: currentMode === 'Simulation',
        spacingTop: 15,
        spacingBottom: 0,
        spacingLeft: 20,
        spacingRight: 20,
      },
      title: { text: undefined },
      xAxis: {
        type: 'datetime',
        ordinal: false,
        tickPositions,
        tickmarkPlacement: 'on',
        startOnTick: false,
        endOnTick: false,
        title: { text: 'Timeline', style: textStyle },
        labels: { style: textStyle, format: '{value:%H:%M:%S}', rotation: -30 },
        gridLineColor: '#fff',
        lineColor: '#fff',
        tickColor: '#fff',
      } as any,
      yAxis: {
        title: { text: 'Power (kW)', style: textStyle },
        labels: {
          style: textStyle,
          formatter: function (this: any) {
            return this.value.toFixed(2);
          },
        },
        gridLineColor: '#fff',
        min: -10,
        max: 10,
        tickInterval: 4,
        plotLines: [
          {
            value: 0,
            color: '#ff0033',
            width: 2.5,
            zIndex: 10,
            label: {
              text: '0 kW',
              align: 'right',
              x: -5,
              style: {
                color: '#ff4d4d',
                textShadow:
                  '0 0 6px #ff1a1a, 0 0 10px #ff1a1a, 0 0 20px rgba(255,0,0,0.8)',
                fontWeight: 'bold',
              },
            },
          },
        ],
      } as any,
      legend: { enabled: true, itemStyle: textStyle },
      tooltip: {
        shared: false,
        backgroundColor: 'rgba(0,0,0,0.9)',
        borderColor: '#374151',
        style: textStyle,
        valueDecimals: 2,
        borderRadius: 6,
        formatter: function (this: any) {
          const dateStr = Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x);
          const seriesName = this.series.name;
          const value = this.y?.toFixed(2) ?? '-';
          return `
      <b>${dateStr}</b><br/>
      ${seriesName}: <b>${value}</b> kW
    `;
        },
      },
      series: [
        {
          name: 'ORC Generated Power',
          type: 'spline',
          data: orcSeries,
          color: '#38bdf8',
          lineWidth: 2,
          marker: { enabled: true },
        },
        {
          name: 'Parasitic Power',
          type: 'spline',
          data: parasiticSeries,
          color: '#facc15',
          lineWidth: 2,
          marker: { enabled: true },
        },
        {
          name: 'Net Power Generated',
          type: 'spline',
          data: netSeries,
          color: '#4ade80',
          lineWidth: 2,
          marker: { enabled: true },
        },
      ],
      credits: { enabled: false },
    };

    return options;
  });
}
