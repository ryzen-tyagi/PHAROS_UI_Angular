import { Component, inject, signal, input, effect } from '@angular/core';
import { LucideAngularModule, Maximize, X } from 'lucide-angular';
import { ModesService } from '../../state/modes.service';
import { ToastService } from '../../shared/toast/toast.service';

/** Port of components/ControlCommandPanel.jsx */
@Component({
  selector: 'app-control-command-panel',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="bg-[#1a1a1a] rounded-md w-[19vw] ml-2 p-[8px] flex flex-col h-[31.9vh]">
      <!-- Header -->
      <div class="flex justify-between items-center mb-2 shrink-0">
        <h3 class="text-white text-base text-[20px] font-semibold">
          Control & Command Panel
        </h3>
        <button class="text-[#00A6E2] hover:text-[#0096d2] transition-colors">
          <lucide-icon [img]="Maximize" [size]="20"></lucide-icon>
        </button>
      </div>

      <!-- Content -->
      <div class="border border-[#5E5E5E] bg-[#000000] rounded-lg flex flex-col items-center justify-center gap-4 flex-1 p-3 overflow-hidden">
        <button
          (click)="showModeModal.set(true)"
          class="border border-[#00A6E2] text-[#00A6E2] bg-transparent rounded-lg hover:bg-[#00A6E2] hover:text-black transition-colors"
          style="width: 12vw; height: 5.5vh; font-size: 14px"
        >
          Mode Selector
        </button>

        <button
          (click)="showSetpointModal.set(true)"
          class="border border-[#00A6E2] text-[#00A6E2] bg-transparent rounded-lg hover:bg-[#00A6E2] hover:text-black transition-colors"
          style="width: 12vw; height: 5.5vh; font-size: 14px"
        >
          Setpoint Management
        </button>
      </div>

      <!-- Mode Selector Modal -->
      @if (showModeModal()) {
        <div class="fixed inset-0 bg-[#1F1F1F80] bg-opacity-50 flex justify-center items-center z-50">
          @if (ModeLoading()) {
            Loading Modes...
          } @else {
            <div class="bg-[#35393D] border border-[#5E5E5E] rounded-lg p-6 w-[32vw] relative">
              <button
                (click)="showModeModal.set(false)"
                class="absolute top-2 right-2 text-[#2D96FF] hover:text-[#1e548a]"
              >
                <lucide-icon [img]="X" [size]="20"></lucide-icon>
              </button>

              <h2 class="text-white text-lg font-semibold mb-4 text-center w-full">
                CONTROL & COMMAND PANEL
              </h2>

              <h3 class="text-[#ffffff] mb-3 font-semibold text-base">
                Mode Selector
              </h3>

              <div class="flex flex-col gap-3 mb-6">
                @for (mode of modelSList(); track mode.id) {
                  <label class="flex items-center gap-2 text-[#ffffff] cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      [value]="mode.name"
                      [checked]="selectedMode() === mode.name"
                      (change)="selectedMode.set(mode.name)"
                      class="w-4 h-4 rounded-full border-2 border-[#2D96FF] appearance-none cursor-pointer relative before:content-[''] before:absolute before:inset-[3px] before:rounded-full before:transition-all before:duration-200"
                      [class]="selectedMode() === mode.name ? 'before:bg-[#2D96FF]' : 'before:bg-transparent'"
                    />

                    <span class="text-white text-lg">{{ mode.name }}</span>
                  </label>
                }
              </div>

              <div class="flex justify-end gap-3">
                <button
                  (click)="handleApplyMode()"
                  class="bg-[#00A6E2] text-[#ffffff] px-5 py-1 rounded-md hover:bg-[#0096d2] transition-colors"
                >
                  Apply
                </button>
                <button
                  (click)="showModeModal.set(false)"
                  class="border border-[#FFFFFF] text-[#ffffff] px-4 py-2 rounded-md hover:bg-[#2a2a2a] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Confirmation Modal -->
      @if (showConfirmModal()) {
        <div class="fixed inset-0 bg-[#00000080] flex items-center justify-center z-[60]">
          <div class="bg-[#2a2a2a] border border-[#5E5E5E] rounded-lg p-6 w-[26vw] text-center">
            <h3 class="text-white text-lg font-semibold mb-4">
              Confirm Mode Change
            </h3>
            <p class="text-gray-300 mb-5">
              Are you sure you want to switch to
              <span class="text-[#00A6E2] font-semibold">{{ selectedMode() }}</span>
              mode?
            </p>
            <div class="flex justify-center gap-4">
              <button
                (click)="changeModeHandler()"
                class="bg-[#00A6E2] text-white px-4 py-2 rounded-md hover:bg-[#0096d2] transition-colors"
              >
                {{ loading() ? 'Changing...' : 'Yes, Confirm' }}
              </button>
              <button
                (click)="showConfirmModal.set(false)"
                class="border border-[#FFFFFF] text-white px-4 py-2 rounded-md hover:bg-[#2a2a2a] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Setpoint Management Modal -->
      @if (showSetpointModal()) {
        <div class="fixed inset-0 bg-[#1F1F1F80] bg-opacity-50 flex justify-center items-center z-50">
          <div class="bg-[#35393D] border border-[#5E5E5E] rounded-lg p-6 w-[32vw] relative">
            <button
              (click)="showSetpointModal.set(false)"
              class="absolute top-2 right-2 text-[#2D96FF] hover:text-[#1e548a]"
            >
              <lucide-icon [img]="X" [size]="20"></lucide-icon>
            </button>

            <h2 class="text-white text-lg font-semibold mb-4 text-center w-full">
              SETPOINT MANAGEMENT
            </h2>

            <div class="flex flex-col gap-5 mb-6">
              <!-- T_heat_in -->
              <div>
                <label class="text-white text-sm">T_heat_in (°C):</label>
                <div class="flex items-center gap-3 ">
                  <input
                    type="number"
                    [value]="tHeatIn()"
                    (input)="tHeatIn.set(+$any($event.target).value)"
                    class="bg-[#1F1F1F] border border-gray-500 rounded-md text-white text-sm px-2 py-1 mt-1 w-16"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    [value]="tHeatIn()"
                    (input)="tHeatIn.set(+$any($event.target).value)"
                    class="flex-1 accent-[#00A6E2]"
                  />
                </div>
              </div>

              <!-- TES Limit -->
              <div>
                <label class="text-white text-sm">TES SoC Limit (%):</label>
                <div class="flex items-center gap-3">
                  <input
                    type="number"
                    [value]="tesLimit()"
                    (input)="tesLimit.set(+$any($event.target).value)"
                    class="bg-[#1F1F1F] border border-gray-500 rounded-md text-white text-sm px-2 py-1  mt-1 w-16"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    [value]="tesLimit()"
                    (input)="tesLimit.set(+$any($event.target).value)"
                    class="flex-1 accent-[#00A6E2]"
                  />
                </div>
              </div>

              <!-- ORC Temp -->
              <div>
                <label class="text-white text-sm">
                  ORC Inlet Temp (°C):
                </label>
                <div class="flex items-center gap-3">
                  <input
                    type="number"
                    [value]="orcTemp()"
                    (input)="orcTemp.set(+$any($event.target).value)"
                    class="bg-[#1F1F1F] border border-gray-500 rounded-md text-white text-sm px-2 py-1  mt-1 w-16"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    [value]="orcTemp()"
                    (input)="orcTemp.set(+$any($event.target).value)"
                    class="flex-1 accent-[#00A6E2]"
                  />
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-3">
              <button
                (click)="handleSaveSetpoints()"
                class="bg-[#00A6E2] text-white px-4 py-2 rounded-md hover:bg-[#0096d2] transition-colors"
              >
                Save Setpoints
              </button>
              <button
                (click)="handleResetDefaults()"
                class="border border-[#FFFFFF] text-[#ffffff] px-4 py-2 rounded-md hover:bg-[#2a2a2a] transition-colors"
              >
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Setpoint Confirmation Modal -->
      @if (showSetpointConfirm()) {
        <div class="fixed inset-0 bg-[#00000080] flex items-center justify-center z-[60]">
          <div class="bg-[#2a2a2a] border border-[#5E5E5E] rounded-lg p-6 w-[26vw] text-center">
            <h3 class="text-white text-lg font-semibold mb-4">
              Confirm Setpoint Save
            </h3>
            <p class="text-gray-300 mb-5">
              Are you sure you want to save the following setpoints?
            </p>
            <div class="text-gray-200 mb-5 text-sm text-left ml-8">
              <p>
                • T_heat_in:
                <span class="text-[#00A6E2]">{{ tHeatIn() }} °C</span>
              </p>
              <p>
                • TES Limit:
                <span class="text-[#00A6E2]">{{ tesLimit() }} %</span>
              </p>
              <p>
                • ORC Inlet Temp:
                <span class="text-[#00A6E2]">{{ orcTemp() }} °C</span>
              </p>
            </div>
            <div class="flex justify-center gap-4">
              <button
                (click)="confirmSaveSetpoints()"
                class="bg-[#00A6E2] text-white px-4 py-2 rounded-md hover:bg-[#0096d2] transition-colors"
              >
                Yes, Save
              </button>
              <button
                (click)="showSetpointConfirm.set(false)"
                class="border border-[#FFFFFF] text-white px-4 py-2 rounded-md hover:bg-[#2a2a2a] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ControlCommandPanelComponent {
  // Inputs (mirror React props)
  modelSList = input<any[]>([]);
  ModeLoading = input<boolean>(false);
  ModeError = input<string>('');
  currentMode = input<string>('');

  private modesSvc = inject(ModesService);
  private toast = inject(ToastService);

  protected readonly Maximize = Maximize;
  protected readonly X = X;

  // React: const { current, loading } = useSelector((state) => state.modes);
  current = this.modesSvc.current;
  loading = this.modesSvc.loading;

  showModeModal = signal(false);
  showConfirmModal = signal(false);
  showSetpointModal = signal(false);
  showSetpointConfirm = signal(false);
  selectedMode = signal<string>(this.modesSvc.current() || 'Live');
  tHeatIn = signal(85);
  tesLimit = signal(85);
  orcTemp = signal(85);

  constructor() {
    // React: useEffect(() => { if (current) setSelectedMode(current); }, [current]);
    effect(() => {
      const cur = this.current();
      if (cur) this.selectedMode.set(cur);
    });
  }

  // change mode
  async changeModeHandler(): Promise<void> {
    try {
      await this.modesSvc.changeMode({
        mode: this.selectedMode(),
        reason: 'User switched mode',
        note: '',
      });
      this.toast.success(`Mode changed to ${this.selectedMode()}`);
      this.showConfirmModal.set(false);
      this.showModeModal.set(false);
      this.modesSvc.fetchCurrentModes();
    } catch (e: any) {
      this.toast.error(this.modesSvc.error() || 'Failed to change mode');
    }
  }

  handleApplyMode(): void {
    if (!this.selectedMode()) {
      this.toast.error('Please select a mode before applying.');
      return;
    }
    this.showConfirmModal.set(true);
  }

  handleSaveSetpoints(): void {
    this.showSetpointConfirm.set(true);
  }

  confirmSaveSetpoints(): void {
    console.log('Setpoints Saved:', {
      tHeatIn: this.tHeatIn(),
      tesLimit: this.tesLimit(),
      orcTemp: this.orcTemp(),
    });
    this.toast.success('Setpoints saved successfully!');
    this.showSetpointConfirm.set(false);
    this.showSetpointModal.set(false);
  }

  handleResetDefaults(): void {
    this.tHeatIn.set(85);
    this.tesLimit.set(85);
    this.orcTemp.set(85);
    this.toast.success('Setpoints reset to defaults');
  }
}
