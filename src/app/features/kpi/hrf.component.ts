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

interface HrfPoint {
  it_power: number;
  recovered_waste_heat: number;
  HRF: number;
  timestamp: string | number;
}

/** Port of KPIs/HRF.jsx — dual mode (Live=KpiService, Simulation=socket). */
@Component({
  selector: 'app-hrf',
  standalone: true,
  imports: [HighchartsChartModule],
  template: `
    @if (chartData().length === 0) {
      <div class="text-white p-8 h-full w-full flex items-center justify-center">
        {{
          currentMode() === 'Simulation'
            ? 'Connecting to HRF Simulation Stream...'
            : 'Loading Latest HRF Data...'
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
export class HrfComponent implements OnDestroy {
  private socketSvc = inject(SocketService);
  private kpi = inject(KpiService);

  Highcharts: typeof Highcharts = Highcharts;

  height = input<string>('');
  width = input<string>('');
  fontSize = input<string>('');
  currentMode = input<string>('');

  chartData = signal<HrfPoint[]>([]);

  private socket: Socket | null = null;

  // guards to fix "initial snapshot" issue
  private skipNextLive = false;
  private historyLoaded = false;

  constructor() {
    /** 2) Format Redux Data (Live Mode) -> keep last 15 */
    effect(() => {
      const hrfHistory = this.kpi.hrfHistory();
      if (
        this.currentMode() !== 'Simulation' &&
        Array.isArray(hrfHistory) &&
        hrfHistory.length > 0
      ) {
        // pick latest simulation_id in the feed (assumes newest first)
        const latestSimId = hrfHistory[0]?.simulation_id;
        const filtered = latestSimId
          ? hrfHistory.filter((item: any) => item.simulation_id === latestSimId)
          : hrfHistory;

        const formatted: HrfPoint[] = filtered?.map((d: any) => ({
          it_power: parseFloat(d?.it_power || 0),
          recovered_waste_heat: parseFloat(d?.recovered_waste_heat || 0),
          HRF: parseFloat(d?.hrf_percentage || 0),
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

      /** 1) Load Historical Data for Live Mode */
      if (mode !== 'Simulation') {
        const to = new Date();
        const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
        this.kpi.fetchHrfHistory({
          limit: 500,
          fromDate: from.toISOString(),
          toDate: to.toISOString(),
        });
        return;
      }

      /** 3) Simulation Mode: Historical + Streaming */
      this.skipNextLive = true;
      this.historyLoaded = false;

      const socket = this.socketSvc.connect();
      this.socket = socket;

      socket.on('connect', () => {
        // skip the first live tick after each (re)connect, but do NOT reset
        // historyLoaded — on a flaky reconnect the server may not re-send
        // history, and resetting it would gate out all live ticks forever.
        this.skipNextLive = true;
      });

      socket.on('hrfHistoricalData', (data: any) => {
        if (data?.data?.length) {
          const formatted: HrfPoint[] = data.data.map((d: any) => ({
            it_power: parseFloat(d.it_power || 0),
            recovered_waste_heat: parseFloat(d.recovered_waste_heat || 0),
            HRF: parseFloat(d.HRF || 0),
            timestamp: d.timestamp,
          }));
          this.chartData.set(formatted.slice(-15));
          this.historyLoaded = true;
        }
      });

      socket.on('hrfData', (data: any) => {
        // 1) hard-skip the very first live message after connect
        if (this.skipNextLive) {
          this.skipNextLive = false;
          return;
        }
        // 2) ignore live ticks until history is set
        if (!this.historyLoaded) return;

        const newPoint: HrfPoint = {
          it_power: parseFloat(data?.it_power || 0),
          recovered_waste_heat: parseFloat(data?.recovered_waste_heat || 0),
          HRF: parseFloat(data?.HRF || 0),
          timestamp: data?.timestamp_pst || data?.timestamp || Date.now(),
        };

        this.chartData.update((prev) => {
          const newTs = new Date(newPoint.timestamp).getTime();
          const lastTs = prev.length
            ? new Date(prev[prev.length - 1].timestamp).getTime()
            : -Infinity;
          // ignore dup/out-of-order
          if (newTs <= lastTs) return prev;
          const updated = [...prev, newPoint];
          return updated.slice(-15);
        });
      });

      socket.emit('getSensorHistory', { type: 'hrfHistoricalData' });
    });
  }

  ngOnDestroy(): void {
    this.teardownSocket();
  }

  private teardownSocket(): void {
    if (this.socket) {
      this.socket.off('hrfData');
      this.socket.off('hrfHistoricalData');
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

    const seriesItPower = chartData.map((d) => [this.toPstMs(d.timestamp), d.it_power]);
    const seriesRecovered = chartData.map((d) => [
      this.toPstMs(d.timestamp),
      d.recovered_waste_heat,
    ]);
    const seriesHRF = chartData.map((d) => [this.toPstMs(d.timestamp), d.HRF]);

    // ensure ascending by x
    const sortByX = (a: number[], b: number[]) => a[0] - b[0];
    seriesItPower.sort(sortByX);
    seriesRecovered.sort(sortByX);
    seriesHRF.sort(sortByX);

    const tickPositions = seriesItPower.map((p) => p[0]);
    const textStyle = { color: '#fff', fontSize };

    const options: Highcharts.Options = {
      chart: {
        zoomType: 'x',
        backgroundColor: undefined,
        animation: currentMode === 'Simulation',
        spacingTop: 15,
        spacingBottom: 0,
        spacingLeft: 20,
        spacingRight: 20,
      } as any,
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
      yAxis: [
        {
          title: { text: 'Power (kW)', style: textStyle },
          labels: {
            style: textStyle,
            formatter: function (this: any) {
              return this.value.toFixed(2);
            },
          },
          min: 0,
          max: 100,
          tickInterval: 20,
          tickAmount: 6,
        },
        {
          title: { text: 'HRF (%)', style: textStyle },
          opposite: true,
          labels: {
            style: textStyle,
            formatter: function (this: any) {
              return this.value.toFixed(2);
            },
          },
          min: 0,
          max: 100,
          tickInterval: 20,
          tickAmount: 6,
        },
      ],
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
          const value = this.y?.toFixed(2) ?? '-';

          return `
      <b>${dateStr}</b><br/>
      ${this.series.name}: <b>${value}</b> ${this.series.name === 'HRF' ? '%' : 'kW'}
    `;
        },
      },
      series: [
        {
          name: 'IT Power',
          type: 'spline',
          data: seriesItPower,
          color: '#FF0000',
          yAxis: 0,
          lineWidth: 2.2,
          marker: { enabled: true },
        },
        {
          name: 'Recovered Waste Heat',
          type: 'spline',
          data: seriesRecovered,
          color: '#FFA500',
          yAxis: 0,
          lineWidth: 2.2,
          marker: { enabled: true },
        },
        {
          name: 'HRF',
          type: 'spline',
          data: seriesHRF,
          color: '#007BFF',
          yAxis: 1,
          lineWidth: 2.2,
          marker: { enabled: true },
        },
      ],
      credits: { enabled: false },
    };

    return options;
  });
}
