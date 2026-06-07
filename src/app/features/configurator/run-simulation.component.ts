import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

/** = components/RunSimulation.jsx (static UI) */
@Component({
  selector: 'app-run-simulation',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="w-full h-full p-4 bg-[#0d0f16] text-white rounded-lg border border-neutral-700">
      <h2 class="text-xl font-semibold mb-4">Run</h2>
      <div class="grid grid-cols-2 gap-4">
        <!-- LEFT SIDE — SIMULATION INPUT -->
        <div class="bg-[#11131a] border-neutral-700 text-white rounded-lg border">
          <!-- CardHeader -->
          <div class="flex flex-col space-y-1.5 p-6">
            <!-- CardTitle -->
            <div class="text-2xl font-semibold leading-none tracking-tight">
              Simulation Input String
            </div>
          </div>
          <!-- CardContent -->
          <div class="p-6 pt-0">
            <!-- ScrollArea -->
            <div class="relative overflow-hidden h-[26vh] rounded-md border border-neutral-700 p-2 bg-black text-sm">
              <textarea
                [(ngModel)]="inputText"
                class="w-full h-[26vh] bg-transparent outline-none resize-none"
              ></textarea>
            </div>

            <div class="flex justify-end gap-4 mt-6">
              <button
                class="w-32 border border-neutral-600 text-white bg-black hover:bg-neutral-800 hover:text-white inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 transition-colors"
              >
                Cancel
              </button>

              <button
                class="w-32 flex gap-2 bg-blue-600 hover:bg-blue-700 inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 transition-colors text-white"
              >
                <span>⏯</span>
                Run / Pause
              </button>
            </div>
          </div>
        </div>

        <!-- RIGHT SIDE — LIVE LOG -->
        <div class="bg-[#11131a] border-neutral-700 text-white rounded-lg border">
          <!-- CardHeader -->
          <div class="flex flex-col space-y-1.5 p-6">
            <!-- CardTitle -->
            <div class="text-2xl font-semibold leading-none tracking-tight">
              Simulation Log (Live)
            </div>
          </div>
          <!-- CardContent -->
          <div class="p-6 pt-0">
            <!-- ScrollArea -->
            <div class="relative overflow-hidden h-[26vh] w-full bg-transparent outline-none resize-none rounded-md border border-neutral-700 p-2 bg-black text-sm">
              @for (log of logs(); track $index) {
                <div class="mb-1">• {{ log }}</div>
              }
            </div>

            <div class="flex justify-end mt-6">
              <button
                class="w-32 bg-red-500 text-white hover:bg-red-500/90 inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 transition-colors"
              >
                Abandon
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RunSimulationComponent {
  inputText = Array(10).fill('Lorem Ipsum is simply dummy text of the').join('\n');
  logs = signal<string[]>(Array(8).fill('[4:38:47 pm] Live stream stopped'));
}
