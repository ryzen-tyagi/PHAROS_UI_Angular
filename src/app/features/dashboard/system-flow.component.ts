import { Component, inject, signal, input, output, OnDestroy, effect } from '@angular/core';
import { LucideAngularModule, Maximize } from 'lucide-angular';
import { Socket } from 'socket.io-client';
import { SocketService } from '../../core/socket.service';
import { modeStyles } from '../../shared/util/helper';
import { LpsComponent } from '../kpi/lps.component';
import { TesComponent } from '../kpi/tes.component';

interface SocketData {
  temperature: number;
  powerUsage: number;
  efficiency: number;
  reclaimedHeat: number;
}

/** Port of components/SystemFlow.jsx (SystemFlowDiagram). */
@Component({
  selector: 'app-system-flow',
  standalone: true,
  imports: [LucideAngularModule, LpsComponent, TesComponent],
  template: `
    <div class="bg-[#181818] rounded-lg w-[47.5vw] ml-2 p-2 flex flex-col h-[53vh]">
      <div class="border border-[#5E5E5E] rounded-md p-2 flex flex-col h-full">
        <!-- Header with Tabs -->
        <div class="flex justify-between items-center gap-2 mb-3">
          <div class="flex gap-2">
            <button
              (click)="activeTab.set('sfg')"
              class="px-3 py-1 rounded-md text-sm font-medium transition-colors"
              [class]="activeTab() === 'sfg'
                ? 'bg-[#00A6E2] text-white'
                : 'bg-transparent border border-[#3a3a3a] text-gray-400 hover:text-white'"
            >
              LIVE PHAROS System
            </button>
            <button
              (click)="activeTab.set('tes')"
              class="px-3 py-1 rounded-md text-sm font-medium transition-colors"
              [class]="activeTab() === 'tes'
                ? 'bg-[#00A6E2] text-white'
                : 'bg-transparent border border-[#3a3a3a] text-gray-400 hover:text-white'"
            >
              LIVE TES Visualization
            </button>
          </div>

          <!-- Mode + Maximize -->
          <div class="flex items-center gap-3 text-gray-400 text-sm">
            <div class="flex justify-end items-center text-sm">
              <span
                class="rounded-lg px-3 py-1 text-sm font-medium"
                [class]="modeTagClass()"
              >
                ● {{ currentMode() }} Mode
              </span>
            </div>
            @if (currentMode() === 'Simulation') {
              <span class="flex justify-end items-center text-sm">
                <!-- Show START button when simulation is STOPPED -->
                @if (simulationStatus() === false) {
                  <button
                    (click)="simulationToggle.emit('start')"
                    class="text-[#51cf66] border-[#51cf66] bg-[rgba(81,207,102,0.1)] rounded-lg px-2 py-1 text-sm font-medium"
                  >
                    {{ loading() ? 'Changing' : 'Start Simulation' }}
                  </button>
                }

                <!-- Show STOP button when simulation is RUNNING -->
                @if (simulationStatus() === true) {
                  <button
                    (click)="simulationToggle.emit('stop')"
                    class="text-red-400 border-red-300 bg-[rgba(255,0,0,0.12)] rounded-lg px-2 py-1 text-sm font-medium"
                  >
                    {{ loading() ? 'Changing' : 'Stop Simulation' }}
                  </button>
                }
              </span>
            }
            <lucide-icon
              [img]="Maximize"
              [size]="20"
              (click)="handleMaximize()"
              class="text-[#00A6E2] hover:text-[#0096d2] transition-colors cursor-pointer"
              title="Open Full Screen"
            ></lucide-icon>
          </div>
        </div>

        <!-- Main Layout -->
        <div class="flex flex-1 gap-3 overflow-hidden">
          <!-- Left Panel -->
          <div class="flex-1 bg-[#252525] rounded-lg border border-[#3a3a3a] flex items-center justify-center overflow-hidden min-h-0">
            @if (activeTab() === 'sfg') {
              <app-lps [currentMode]="currentMode()"></app-lps>
            } @else {
              <app-tes></app-tes>
            }
          </div>

          <!-- Right Metrics Panel -->
          <div class="flex flex-col gap-0 justify-between bg-[#2F373E] rounded-lg p-2 border border-[#3a3a3a] w-[6vw] cursor-default overflow-visible">
            <!-- Temperature -->
            <div class="relative group bg-[#0D0D0D] rounded-lg p-1 flex flex-col items-center justify-center hover:border hover:border-yellow-500 transition-all h-[8vh] overflow-visible ">
              <img src="/icons/temp2.svg" alt="Heat" class="w-6 h-6 mt-1" />
              <div class="text-white text-sm font-semibold transition-opacity duration-500">
                {{ socketData().temperature.toFixed(2) }} <span class="text-[10px]">°C</span>
              </div>
              <div class="absolute bottom-[80%] left-[30%] transform -translate-x-1/2 mb-1 px-2 py-1 text-[11px] text-black bg-white rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-500  text-center">
                ORC Input Temperature (°C)
              </div>
            </div>

            <!-- Power Usage -->
            <div class="relative group bg-[#0D0D0D] rounded-lg p-1 flex flex-col items-center justify-center hover:border hover:border-yellow-500 transition-all h-[8vh] overflow-visible">
              <img src="/icons/power2.svg" alt="Power" class="w-6 h-6 mt-1" />
              <div class="text-white text-sm font-semibold transition-opacity duration-500">
                {{ socketData().powerUsage.toFixed(2) }} <span class="text-[10px]">kW</span>
              </div>
              <div class="absolute bottom-[110%] left-[30%] transform -translate-x-1/2 mb-1 px-2 py-1 text-[11px] text-black bg-white rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-500  text-center">
                Power Usage (kW)
              </div>
            </div>

            <!-- Efficiency -->
            <div class="relative group bg-[#0D0D0D] rounded-lg p-1 flex flex-col items-center justify-center hover:border hover:border-yellow-500 transition-all h-[8vh] overflow-visible">
              <img src="/icons/efficiency2.svg" alt="Efficiency" class="w-6 h-6 mt-1" />
              <div class="text-white text-sm font-semibold transition-opacity duration-500">
                {{ socketData().efficiency.toFixed(2) }} <span class="text-[10px]">%</span>
              </div>
              <div class="absolute bottom-[110%] left-[30%] transform -translate-x-1/2 mb-1 px-2 py-1 text-[11px] text-black bg-white rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50  text-center">
                System Efficiency (%)
              </div>
            </div>

            <!-- Reclaimed Heat -->
            <div class="relative group bg-[#0D0D0D] rounded-lg p-1 flex flex-col items-center justify-center hover:border hover:border-yellow-500 transition-all h-[8vh] overflow-visible">
              <img src="/icons/heat2.svg" alt="Reclaimed Heat" class="w-6 h-6 mt-1" />
              <div class="text-white text-sm font-semibold transition-opacity duration-500">
                {{ socketData().reclaimedHeat.toFixed(2) }} <span class="text-[10px]">kJ</span>
              </div>
              <div class="absolute bottom-[110%] left-[30%] transform -translate-x-1/2 mb-1 px-2 py-1 text-[11px] text-black bg-white rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50  text-center">
                Reclaimed Heat (kJ)
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Legend -->
        <div class="flex justify-center gap-6 mt-3 text-xs text-[#ffffff] shrink-0">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 bg-[#EB3100] rounded-full"></span>
            <span>Hot</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 bg-[#17A6FF] rounded-full"></span>
            <span>Cold</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SystemFlowComponent implements OnDestroy {
  currentMode = input<string>('');
  simulationStatus = input<boolean>(false);
  loading = input<boolean>(false);

  // React passes handleSimulationToggle prop
  simulationToggle = output<'start' | 'stop'>();

  private socketSvc = inject(SocketService);
  private socket?: Socket;

  protected readonly Maximize = Maximize;

  activeTab = signal<'sfg' | 'tes'>('sfg');
  socketData = signal<SocketData>({
    temperature: 74.8,
    powerUsage: 1024,
    efficiency: 87.2,
    reclaimedHeat: 1024,
  });

  modeTagClass(): string {
    const s = modeStyles[this.currentMode()];
    return s ? `${s.text} ${s.border} ${s.bg}` : '';
  }

  constructor() {
    // React: useEffect(..., [currentMode])
    effect(() => {
      const mode = this.currentMode();
      this.teardownSocket();

      if (mode === 'Simulation') {
        console.log('🟢 Simulation mode active - connecting to socket...');
        // React uses io(WS_BASE) (allow polling-upgrade)
        const s = this.socketSvc.connect({});
        this.socket = s;

        s.on('hrfData', (_data: any) => {
          // console.log("HRF Data Received:", data);
        });

        s.on('powerMetrics', (metrics: any[]) => {
          const newData: SocketData = {
            temperature: parseFloat(
              metrics.find((m) => m.title.includes('Heat Temp'))?.value || 0
            ),
            powerUsage: parseFloat(
              metrics.find((m) => m.title.includes('Power Usage'))?.value || 0
            ),
            efficiency: parseFloat(
              metrics.find((m) => m.title.includes('Efficiency'))?.value || 0
            ),
            reclaimedHeat: parseFloat(
              metrics.find((m) => m.title.includes('Reclaimed Heat'))?.value || 0
            ),
          };
          this.socketData.set(newData);
        });
      } else {
        console.log('🔴 Simulation mode off - socket closed');
      }
    });
  }

  handleMaximize(): void {
    const route = this.activeTab() === 'sfg' ? 'sfg' : 'tes';
    this.handleExpandClick(route);
  }

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
      console.log('🔌 Disconnected from simulation socket');
      this.socket = undefined;
    }
  }

  ngOnDestroy(): void {
    this.teardownSocket();
  }
}
