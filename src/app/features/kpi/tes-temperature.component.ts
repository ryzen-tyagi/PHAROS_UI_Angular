import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import type { Socket } from 'socket.io-client';
import { SocketService } from '../../core/socket.service';

interface TesPoint {
  timestamp: string | number;
  t2: number;
}

/** Port of KPIs/TESTemperature.jsx — socket events sensorHistoricalData/sensorData (t2). */
@Component({
  selector: 'app-tes-temperature',
  standalone: true,
  imports: [HighchartsChartModule],
  template: `
    @if (chartData().length === 0) {
      <div class="text-white p-8 h-full w-full">
        {{
          currentMode() === 'Simulation'
            ? 'Connecting to Simulation Server...'
            : 'Loading Live Temperature Data...'
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
export class TesTemperatureComponent implements OnInit, OnDestroy {
  private socketSvc = inject(SocketService);

  Highcharts: typeof Highcharts = Highcharts;

  height = input<string>('');
  width = input<string>('');
  fontSize = input<string>('');
  currentMode = input<string>('');

  chartData = signal<TesPoint[]>([]);

  private socket: Socket | null = null;

  // guards to fix the initial snapshot tick issue
  private skipNextLive = false;
  private historyLoaded = false;

  ngOnInit(): void {
    // 3) WebSocket (Simulation & Live) with skip-first-live fix
    const socket = this.socketSvc.connect();
    this.socket = socket;

    socket.on('connect', () => {
      // On each (re)connect, skip the next live tick.
      this.skipNextLive = true;
      // Only use historyLoaded gate in Simulation; for Live we rely on Redux.
      this.historyLoaded = this.currentMode() !== 'Simulation' ? true : false;
    });

    socket.on('sensorHistoricalData', (data: any) => {
      if (this.currentMode() === 'Simulation' && data?.data?.length) {
        const formatted: TesPoint[] = data?.data?.map((d: any) => ({
          timestamp: d?.timestamp,
          t2: parseFloat(d?.t2 || 0),
        }));
        this.chartData.set(formatted?.slice(-15));
        this.historyLoaded = true;
      }
    });

    socket.on('sensorData', (data: any) => {
      // 1) hard-skip the first live message after connect
      if (this.skipNextLive) {
        this.skipNextLive = false;
        return;
      }
      // 2) ignore live ticks until history is set in Simulation mode
      if (!this.historyLoaded) return;

      const newPoint: TesPoint = {
        timestamp: data?.timestamp,
        t2: parseFloat(data?.t2 || 0),
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

    if (this.currentMode() === 'Simulation') {
      socket.emit('getSensorHistory', { type: 'sensorHistoricalData' });
    }
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.off('sensorData');
      this.socket.off('sensorHistoricalData');
      this.socket.disconnect();
    }
  }

  chartOptions = computed<Highcharts.Options>(() => {
    const chartData = this.chartData();
    const fontSize = this.fontSize();
    const currentMode = this.currentMode();

    // 4) Series + exact tick positions for these 15 points
    const seriesData = chartData.map((d) => {
      const utcTime = new Date(d.timestamp).getTime();
      // PST offset = UTC - 8 hours
      const pstTime = utcTime - 8 * 60 * 60 * 1000;
      return [pstTime, d.t2];
    });
    const tickPositions = seriesData.map((p) => p[0]);

    const textStyle = { color: '#fff', fontSize };

    const options: Highcharts.Options = {
      chart: {
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
        labels: { style: textStyle, format: '{value:%H:%M:%S}', rotation: -30 },
        title: { text: 'Timeline', style: textStyle },
        gridLineColor: '#fff',
        lineColor: '#fff',
        tickColor: '#fff',
      } as any,
      yAxis: {
        title: {
          text: 'Temperature (°C)',
          style: textStyle,
        },
        labels: {
          style: textStyle,
          formatter: function (this: any) {
            return this.value.toFixed(2);
          },
        },
        min: 65,
        max: 80,
        tickInterval: 4,
        gridLineColor: '#fff',
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
          name: 'T2 Temperature',
          type: 'spline',
          data: seriesData,
          color: '#FFEF10',
          lineWidth: 2.5,
          marker: { enabled: true },
        },
      ],
      credits: { enabled: false },
    };

    return options;
  });
}
