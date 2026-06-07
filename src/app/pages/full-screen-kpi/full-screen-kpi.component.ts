import { Component, inject, computed, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LucideAngularModule, PanelRight } from 'lucide-angular';
import { HeaderComponent } from '../../layout/header.component';
import { FooterComponent } from '../../layout/footer.component';
import { GlobalLayoutComponent } from '../../layout/global-layout.component';
import { DateTimePickerComponent } from '../../shared/date-time-picker/date-time-picker.component';
import { HrfComponent } from '../../features/kpi/hrf.component';
import { TesTemperatureComponent } from '../../features/kpi/tes-temperature.component';
import { ParasiticPowerRatioComponent } from '../../features/kpi/parasitic-power-ratio.component';
import { SfgComponent } from '../../features/kpi/sfg.component';
import { TesComponent } from '../../features/kpi/tes.component';
import { DigitalConfiguratorComponent } from '../../features/configurator/digital-configurator.component';
import { ModesService } from '../../state/modes.service';
import { ModeChannelService } from '../../core/mode-channel.service';
import { SidebarService } from '../../layout/sidebar.service';

/** Port of components/FullScreenLayout.jsx — full-screen KPI by route param. */
@Component({
  selector: 'app-full-screen-kpi',
  standalone: true,
  imports: [
    LucideAngularModule,
    HeaderComponent,
    FooterComponent,
    GlobalLayoutComponent,
    DateTimePickerComponent,
    HrfComponent,
    TesTemperatureComponent,
    ParasiticPowerRatioComponent,
    SfgComponent,
    TesComponent,
    DigitalConfiguratorComponent,
  ],
  template: `
    @if (title()) {
      <div class="flex flex-col w-full min-h-screen bg-[#121212] text-white">
        <div class="rounded-lg absolute z-30 h-[88vh] bg-[#181818] top-[3.2rem] left-0">
          <app-global-layout></app-global-layout>
        </div>
        <app-header [title]="title()"></app-header>
        <div class="flex justify-between w-full">
          <div class="w-[3%] p-2 cursor-pointer text-white ">
            <lucide-icon
              [img]="PanelRight"
              [size]="24"
              (click)="sidebar.setOpen(!sidebar.open())"
              class="text-white cursor-pointer"
            ></lucide-icon>
          </div>
          <span class="bg-white border w-[1px] h-[87vh]"></span>
          <div class="flex-1 flex flex-col ">
            <!-- DATE/TIME FILTER PLACED HERE (Normal Flow) -->
            @if (id() !== 'sfg' && id() !== 'tes' && id() !== 'waste_heat_configurator') {
              <div class="px-4 pb-2 pt-1">
                <app-date-time-picker [currentMode]="modes.current() ?? ''"></app-date-time-picker>
              </div>
            }
            <!-- Main Content Area -->
            <main class="flex-1 w-full h-full overflow-auto p-4 flex justify-center items-center">
              <div class="bg-[#1e1e1e] w-full h-full p-6 rounded-xl shadow-lg  ">
                @switch (id()) {
                  @case ('heat_recovery_factor') {
                    <app-hrf
                      height="70vh" width="92vw" fontSize="18px"
                      [currentMode]="modes.current() ?? ''"
                    ></app-hrf>
                  }
                  @case ('TES_discharge') {
                    <app-tes-temperature
                      height="70vh" width="92vw" fontSize="18px"
                      [currentMode]="modes.current() ?? ''"
                    ></app-tes-temperature>
                  }
                  @case ('parasitic_power_ratio') {
                    <app-parasitic-power-ratio
                      height="70vh" width="92vw" fontSize="18px"
                      [currentMode]="modes.current() ?? ''"
                    ></app-parasitic-power-ratio>
                  }
                  @case ('sfg') {
                    <app-sfg
                      height="70vh" width="92vw"
                      [currentMode]="modes.current() ?? ''"
                    ></app-sfg>
                  }
                  @case ('tes') {
                    <app-tes
                      height="70vh" width="92vw"
                    ></app-tes>
                  }
                  @case ('waste_heat_configurator') {
                    <app-digital-configurator
                      height="70vh" width="92vw" fontSize="18px"
                    ></app-digital-configurator>
                  }
                }
              </div>
            </main>
          </div>
        </div>
        <app-footer></app-footer>
      </div>
    } @else {
      <div class="flex justify-center items-center h-screen text-white text-lg">
        Unknown KPI: {{ id() }}
      </div>
    }
  `,
})
export class FullScreenKpiComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  protected modes = inject(ModesService);
  private modeChannel = inject(ModeChannelService);
  protected sidebar = inject(SidebarService);

  protected readonly PanelRight = PanelRight;

  private unsub?: () => void;

  protected id = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' },
  );

  // Match the KPI id to the correct title (empty => Unknown KPI).
  private readonly titleMap: Record<string, string> = {
    heat_recovery_factor: 'PHAROS-Heat Recovery Factor (HRF)',
    TES_discharge: 'PHAROS-TES Discharge Temperature - (T2)',
    parasitic_power_ratio: 'PHAROS-Net Power Generated',
    sfg: 'PHAROS-Live PHAROS System',
    tes: 'PHAROS-TES Visualization',
    waste_heat_configurator: 'PHAROS-Waste Heat Configurator',
  };

  protected title = computed(() => this.titleMap[this.id()] ?? '');

  ngOnInit(): void {
    this.modes.fetchCurrentModes();
    this.modes.fetchSimulationStatus();

    // ..auto fetch — re-fetch current mode when changed in another tab
    this.unsub = this.modeChannel.onMessage((data) => {
      if (data?.type === 'MODE_CHANGED') {
        console.log('Mode changed in another tab:', data.mode);
        this.modes.fetchCurrentModes();
      }
    });
  }

  ngOnDestroy(): void {
    this.unsub?.();
  }
}
