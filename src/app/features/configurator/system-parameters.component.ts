import { Component } from '@angular/core';

/** = components/systemParameters.jsx (static UI) */
@Component({
  selector: 'app-system-parameters',
  standalone: true,
  template: `
    <div class="w-full bg-[#181818] border border-gray-700 text-white p-6 rounded-xl">
      <h2 class="text-xl font-semibold mb-2">System Parameters</h2>
      <p class="text-sm font-semibold mb-6">Hardware Set Up &gt; TES Tank</p>
      <p class="text-sm text-neutral-300 mb-4">
        Enter TES (Thermal Energy Storage) tank specifications.
      </p>

      <!-- Card -->
      <div class="bg-neutral-800 border border-neutral-700 rounded-lg">
        <!-- CardContent -->
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-white text-sm mb-1">Height</label>
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  class="w-full bg-neutral-900 text-white border border-neutral-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span class="text-sm text-neutral-400">m</span>
              </div>
            </div>

            <div>
              <label class="block text-white text-sm mb-1">Radius</label>
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="e.g. 500"
                  class="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span class="text-sm text-neutral-400">m</span>
              </div>
            </div>
          </div>

          <div class="mt-6">
            <label class="block text-white text-sm mb-1">Volume</label>
            <div class="flex items-center gap-2">
              <input
                type="number"
                placeholder="e.g. 1000"
                class="w-full bg-neutral-900 border border-neutral-700 rounded-md text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span class="text-sm text-neutral-400">L</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-4 mt-6">
        <button
          class="border border-neutral-600 text-white bg-black hover:bg-neutral-800 hover:text-white inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 transition-colors"
        >
          Cancel
        </button>
        <button
          class="bg-[#2D96FF] hover:bg-[#4884c0] text-white px-6 inline-flex items-center justify-center rounded-md text-sm font-medium h-10 py-2 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  `,
})
export class SystemParametersComponent {}
