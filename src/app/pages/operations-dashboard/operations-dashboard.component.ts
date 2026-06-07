import { Component, inject, OnInit } from '@angular/core';
import { LucideAngularModule, PanelRight } from 'lucide-angular';
import { HeaderComponent } from '../../layout/header.component';
import { FooterComponent } from '../../layout/footer.component';
import { GlobalLayoutComponent } from '../../layout/global-layout.component';
import { SystemFlowComponent } from '../../features/dashboard/system-flow.component';
import { KpisForecastsComponent } from '../../features/dashboard/kpis-forecasts.component';
import { ControlCommandPanelComponent } from '../../features/dashboard/control-command-panel.component';
import { AlarmsEventsComponent } from '../../features/dashboard/alarms-events.component';
import { DiagnosticsAssetHealthComponent } from '../../features/dashboard/diagnostics-asset-health.component';
import { ModesService } from '../../state/modes.service';
import { SidebarService } from '../../layout/sidebar.service';
import { ToastService } from '../../shared/toast/toast.service';

/** Port of pages/OperationsDashboard.jsx. */
@Component({
  selector: 'app-operations-dashboard',
  standalone: true,
  imports: [
    LucideAngularModule,
    HeaderComponent,
    FooterComponent,
    GlobalLayoutComponent,
    SystemFlowComponent,
    KpisForecastsComponent,
    ControlCommandPanelComponent,
    AlarmsEventsComponent,
    DiagnosticsAssetHealthComponent,
  ],
  template: `
    <div class="flex justify-center h-screen  bg-black items-center flex-col w-screen relative ">
      <div class="rounded-lg absolute z-30 h-[88vh] bg-[#181818] top-[3.2rem] left-0">
        <app-global-layout></app-global-layout>
      </div>
      <!-- Main Container -->
      <div class="flex justify-center items-center  flex-col w-full ">
        <app-header title="PHAROS-Operations Dashboard"></app-header>
        <div class="flex justify-between w-full bg-black">
          <div class=" w-[3%] p-2 text-white ">
            <lucide-icon
              [img]="PanelRight"
              [size]="24"
              (click)="sidebar.setOpen(!sidebar.open())"
              class="text-white cursor-pointer"
            ></lucide-icon>
          </div>
          <span class="bg-white border w-[1px] h-[87vh]"></span>
          <div class="flex-1 flex flex-col py-2 px-0 gap-2 w-full">
            <!-- First Row -->
            <div class="flex flex-col md:flex-row gap-2 ">
              <div class="flex-1">
                <app-system-flow
                  [currentMode]="modes.current() ?? ''"
                  (simulationToggle)="handleSimulationHandler($event)"
                  [simulationStatus]="modes.simulationStatus() ?? false"
                  [loading]="modes.loading()"
                ></app-system-flow>
              </div>
              <div class="flex-1">
                <app-kpis-forecasts
                  [currentMode]="modes.current() ?? ''"
                  [simulationStatus]="modes.simulationStatus() ?? false"
                ></app-kpis-forecasts>
              </div>
            </div>
            <!-- Second Row -->
            <div class="flex flex-col lg:flex-row gap-3 ">
              <div class="">
                <app-control-command-panel
                  [modelSList]="modes.list()"
                  [ModeLoading]="modes.loading()"
                  [ModeError]="modes.error() ?? ''"
                  [currentMode]="modes.current() ?? ''"
                ></app-control-command-panel>
              </div>
              <div class="flex-1">
                <app-alarms-events [currentMode]="modes.current() ?? ''"></app-alarms-events>
              </div>
              <div class="flex-1">
                <app-diagnostics-asset-health
                  height="25vh"
                  width="100%"
                  fontSize="14px"
                  [currentMode]="modes.current() ?? ''"
                  [simulationStatus]="modes.simulationStatus() ?? false"
                ></app-diagnostics-asset-health>
              </div>
            </div>
          </div>
        </div>
        <app-footer></app-footer>
      </div>
    </div>
  `,
})
export class OperationsDashboardComponent implements OnInit {
  protected modes = inject(ModesService);
  protected sidebar = inject(SidebarService);
  private toast = inject(ToastService);

  protected readonly PanelRight = PanelRight;

  async handleSimulationHandler(actionType: 'start' | 'stop'): Promise<void> {
    try {
      const payload = await this.modes.simulationStartAndStop(actionType);
      this.toast.success(payload.message);
    } catch {
      this.toast.error('Simulation failed');
    }
    this.modes.fetchSimulationStatus();
    this.modes.fetchModes();
    this.modes.fetchCurrentModes();
  }

  ngOnInit(): void {
    this.modes.fetchModes();
    this.modes.fetchCurrentModes();
    this.modes.fetchSimulationStatus();
  }
}
