import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';

/** = components/digitalConfigurator.jsx (UI-only, ephemeral state) */
@Component({
  selector: 'app-digital-configurator',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="w-full h-full text-white flex flex-col gap-4">
      <!-- Top Row -->
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold flex items-center gap-2">
          <img src="/icons/digitalconfi.svg" alt="Digital Configurator Icon" />
          Digital Configurator
        </h2>

        <div class="flex items-center gap-3">
          <button class="px-4 py-2 text-base text-[#2D96FF] flex gap-2 rounded">
            <img src="/icons/imp.svg" alt="Import Icon" /> Import
          </button>
          <button
            class="px-4 py-2 transition duration-150 border border-[rgba(45,150,255,1)] bg-[rgba(45,150,255,0.5)] hover:bg-[rgba(45,150,255,1)] rounded-md"
          >
            Export JSON
          </button>
        </div>
      </div>

      <!-- Subtitle -->
      <p class="-mt-2">Drag components, set properties, export/import layout</p>

      <!-- Dropdown + Layout -->
      <div class="flex gap-4 w-full h-full">
        <!-- LEFT SIDE COLUMN -->
        <div class="flex flex-col w-[70%] gap-4">
          <select
            class="w-48 bg-black border border-gray-700 px-3 py-2 rounded"
            [(ngModel)]="selectedComponent"
          >
            <option value="TES Tank">TES Tank</option>
            <option value="Pump">Pump</option>
            <option value="Heat Exchanger">Heat Exchanger</option>
          </select>

          <!-- WORKSPACE -->
          <div class="flex-1 bg-black border border-gray-700 rounded flex items-center justify-center relative">
            <div class="text-center text-gray-400">
              <p>Drag &amp; Drop your components here</p>
              <p class="mt-2 text-sm">
                <span class="underline font-semibold text-white cursor-pointer">
                  Double click to delete
                </span>
                {{ ' • ' }}
                <span class="underline cursor-pointer">Click to edit</span>
              </p>
            </div>

            <p class="absolute bottom-2 text-gray-600 text-xs">
              Tip: drag components from left, then click a dropped item to edit
              properties.
            </p>
          </div>
        </div>

        <!-- RIGHT PROPERTIES PANEL -->
        <div class="w-[30%] bg-gray-900 border border-gray-800 rounded p-4 flex flex-col">
          <h3 class="text-lg font-semibold mb-4">Properties</h3>

          <label class="text-sm text-gray-400">Name</label>
          <input
            class="bg-black border border-gray-700 rounded px-2 py-2 mt-1 mb-3 w-full"
            [(ngModel)]="name"
          />

          <label class="text-sm text-gray-400">Tag</label>
          <input
            class="bg-black border border-gray-700 rounded px-2 py-2 mt-1 mb-3 w-full"
            [(ngModel)]="tag"
          />

          <label class="text-sm text-gray-400">Parameters (JSON)</label>
          <textarea
            rows="5"
            class="bg-black border border-gray-700 rounded px-2 py-2 mt-1 mb-3 w-full"
            [(ngModel)]="params"
          ></textarea>

          <!-- Buttons -->
          <div class="flex gap-2 mt-auto">
            <button class="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
              Apply
            </button>
            <button class="flex-1 bg-red-700 hover:bg-red-800 px-4 py-2 rounded">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DigitalConfiguratorComponent {
  // Accepted like the React props (applied to a wrapper if needed).
  height = input<number | string>();
  width = input<number | string>();
  fontSize = input<number | string>();

  selectedComponent = 'TES Tank';
  name = 'Pump-1';
  tag = 'Pump-1';
  params = `{"flow":100}`;
}
