import { Component, inject, signal, input, computed, OnDestroy, effect } from '@angular/core';
import { LucideAngularModule, ArrowLeftCircle, ArrowRightCircle } from 'lucide-angular';
import { Socket } from 'socket.io-client';
import { SocketService } from '../../core/socket.service';
import { SpeedometerGaugeComponent } from '../kpi/speedometer-gauge.component';

interface GaugeItem {
  id: string;
  title: string;
  value: number;
  pointerValue: number;
  min: number;
  max: number;
  unit: string;
  gradient: [number, string][];
}

/** Port of components/KPIsForecasts.jsx
 *  Embla carousel replaced with a simple index-based 3-visible carousel. */
@Component({
  selector: 'app-kpis-forecasts',
  standalone: true,
  imports: [LucideAngularModule, SpeedometerGaugeComponent],
  template: `
    <div class="bg-[#181818] rounded-lg w-[47.5vw] mr-1 p-[8px] !pt-2 flex flex-col h-[53vh]">
      <!-- Header -->
      <div class="flex justify-between items-center mb-2 shrink-0">
        <h3 class="text-white text-base font-semibold">KPIs & Forecasts</h3>
      </div>

      <!-- Gauges -->
      <div class=" border border-[#5E5E5E] rounded-lg h-full bg-[#2F373E] px-0 py-4 flex flex-col justify-center items-center w-[100%] flex-1 overflow-hidden">
        <div class="relative w-[86%] max-w-[90vw] mx-auto flex items-center">
          <!-- Prev -->
          <button
            (click)="prev()"
            class="cursor-pointer transition-all duration-300 ease-in-out bg-[#fff] border border-[#00A6E2] hover:bg-[#00A6E2] hover:scale-110 hover:shadow-lg active:scale-95 rounded-full ml-2 w-8 h-8 flex items-center justify-center shrink-0"
          >
            <lucide-icon [img]="ArrowLeftCircle" [size]="18"></lucide-icon>
          </button>

          <!-- Viewport -->
          <div class="overflow-hidden flex-1">
            <div
              class="flex -ml-2 transition-transform duration-300 ease-in-out"
              [style.transform]="'translateX(-' + (startIndex() * (100 / 3)) + '%)'"
            >
              @for (item of items(); track $index) {
                <div class="basis-1/3 shrink-0 grow-0 pl-2" style="flex: 0 0 33.3333%">
                  <div
                    (click)="handleExpandClick(item.id)"
                    class="bg-[#0D0D0D] rounded-lg flex flex-col items-center justify-between text-center cursor-pointer hover:bg-[#1a1a1a] transition-colors h-[40vh] p-2"
                  >
                    <h3 class="text-white text-base font-semibold p-3">
                      {{ item.title }}
                    </h3>

                    <app-speedometer-gauge
                      [title]="item.title"
                      [value]="item.value"
                      [pointerValue]="item.pointerValue"
                      [minValue]="item.min"
                      [maxValue]="item.max"
                      height="70%"
                      width="100%"
                      fontSize="16px"
                      [unit]="item.unit"
                      [gradient]="item.gradient"
                    ></app-speedometer-gauge>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Next -->
          <button
            (click)="next()"
            class="cursor-pointer transition-all duration-300 ease-in-out bg-[#fff] border border-[#00A6E2] hover:bg-[#00A6E2] hover:scale-110 hover:shadow-lg active:scale-95 rounded-full mr-2 w-8 h-8 flex items-center justify-center shrink-0"
          >
            <lucide-icon [img]="ArrowRightCircle" [size]="18"></lucide-icon>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class KpisForecastsComponent implements OnDestroy {
  currentMode = input<string>('');
  simulationStatus = input<boolean>(false);

  private socketSvc = inject(SocketService);
  private socket?: Socket;

  protected readonly ArrowLeftCircle = ArrowLeftCircle;
  protected readonly ArrowRightCircle = ArrowRightCircle;

  hrfValue = signal(0);
  pprValue = signal<number | string>(0);
  sensor = signal(0);

  // carousel start index (3 visible, max start = length - 3)
  startIndex = signal(0);

  items = computed<GaugeItem[]>(() => [
    {
      id: 'heat_recovery_factor',
      title: 'Heat Recovery Factor (%)',
      value: this.hrfValue(),
      pointerValue: 0,
      min: 0,
      max: 100,
      unit: '%',
      gradient: [
        [0, '#C13527'],
        [1, '#5B1912'],
      ],
    },
    {
      id: 'TES_discharge',
      title: 'TES Discharge Temperature - T2 (°C)',
      value: this.sensor(),
      pointerValue: 20,
      min: 0,
      max: 100,
      unit: '°C',
      gradient: [
        [0, '#0A3D91'],
        [1, '#FF3E00'],
      ],
    },
    {
      id: 'parasitic_power_ratio',
      title: 'Net Power Generated (kW)',
      value: Number(this.pprValue()),
      pointerValue: 0,
      unit: 'kW',
      min: -10,
      max: 10,
      gradient: [
        [0, '#FFE138'],
        [1, '#FF7512'],
      ],
    },
    {
      id: '',
      title: 'Testing 1',
      value: Number(this.pprValue()),
      pointerValue: 0,
      unit: 'kW',
      min: -10,
      max: 10,
      gradient: [
        [0, '#FFE138'],
        [1, '#FF7512'],
      ],
    },
    {
      id: '',
      title: 'Testing 2',
      value: Number(this.pprValue()),
      pointerValue: 0,
      unit: 'kW',
      min: -10,
      max: 10,
      gradient: [
        [0, '#FFE138'],
        [1, '#FF7512'],
      ],
    },
  ]);

  constructor() {
    // React: useEffect(..., [currentMode]) connects/disconnects socket on mode change
    effect(() => {
      const mode = this.currentMode();
      this.teardownSocket();

      if (mode === 'Simulation') {
        console.log('Simulation mode active - connecting to socket...');
        const socket = this.socketSvc.connect();
        this.socket = socket;

        socket.on('connect', () => console.log('Connected to Socket'));
        socket.on('disconnect', () => console.log('🔴 Disconnected from socket'));

        socket.on('hrfData', (data: any) => {
          const parsed = parseFloat(data?.HRF);
          if (!isNaN(parsed)) this.hrfValue.set(parseFloat(parsed.toFixed(2)));
        });

        socket.on('pprData', (data: any) => {
          const parsed = parseFloat(data?.net_power_generated);
          if (!isNaN(parsed)) this.pprValue.set(parsed.toFixed(2));
        });

        socket.on('sensorData', (data: any) => {
          const parsed = parseFloat(data?.t2);
          if (!isNaN(parsed)) this.sensor.set(parseFloat(parsed.toFixed(2)));
        });
      } else {
        console.log('🔵 Live mode active — skipping simulation socket');
        this.hrfValue.set(0);
        this.pprValue.set(0);
        this.sensor.set(0);
      }
    });
  }

  prev(): void {
    this.startIndex.update((i) => Math.max(0, i - 1));
  }

  next(): void {
    const maxStart = Math.max(0, this.items().length - 3);
    this.startIndex.update((i) => Math.min(maxStart, i + 1));
  }

  // For New Window Open
  handleExpandClick(graphId: string): void {
    if (graphId) {
      window.open(`/v1/kpi/${graphId}`, '_blank');
    } else {
      console.error('ID is undefined!');
    }
  }

  private teardownSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
    }
  }

  ngOnDestroy(): void {
    this.teardownSocket();
  }
}
