import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer
      class="w-full h-[5.6vh] z-10 flex justify-between items-center bg-black px-6 md:px-4 border-t-[0.5px] border-t-[#878787] text-sm"
    >
      <div class="flex gap-6 text-[#2D96FF] items-center">
        <span class="text-white">EDGE DEVICE</span>
        <span class="flex items-center gap-2">
          <span class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75 animate-ping"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span class="hover:cursor-pointer hover:underline text-white">Device Status</span>
        </span>
        <span class="flex items-center gap-1">
          <img src="/images/footergraph.png" alt="Telemetry" class="w-4 h-4" />
          <span class="hover:cursor-pointer hover:underline text-white">Telemetry Data</span>
        </span>
        <span class="flex items-center gap-1">
          <img src="/images/footerlink.png" alt="BMS Link" class="w-4 h-4" />
          <span class="hover:cursor-pointer hover:underline text-white">BMS Link</span>
        </span>
      </div>
      <div class="text-white text-sm bg-[#353535] px-2 rounded-lg">
        © Hitachi, Ltd. 2025. All rights reserved
      </div>
    </footer>
  `,
})
export class FooterComponent {}
