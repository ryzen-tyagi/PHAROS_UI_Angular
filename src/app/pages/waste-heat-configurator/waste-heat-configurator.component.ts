import { Component, inject, signal } from '@angular/core';
import { LucideAngularModule, PanelRight, CirclePlus } from 'lucide-angular';
import { HeaderComponent } from '../../layout/header.component';
import { FooterComponent } from '../../layout/footer.component';
import { GlobalLayoutComponent } from '../../layout/global-layout.component';
import { SidebarService } from '../../layout/sidebar.service';
import { StepProgressBarComponent } from '../../features/configurator/step-progress-bar.component';
import { SimulationSidebarComponent } from '../../features/configurator/simulation-sidebar.component';
import { SystemParametersComponent } from '../../features/configurator/system-parameters.component';
import { SimulationParameterComponent } from '../../features/configurator/simulation-parameter.component';
import { RunSimulationComponent } from '../../features/configurator/run-simulation.component';

interface WizardStep {
  id: number;
  label: string;
  panel: string;
}

const wizardSteps: WizardStep[] = [
  { id: 1, label: 'Start', panel: 'StartPanel' },
  { id: 2, label: 'TES Tank', panel: 'TES Tank' },
  { id: 3, label: 'Number of Steps', panel: 'Number of Steps' },
  { id: 4, label: 'Simulation Input String', panel: 'Simulation Input String' },
  { id: 5, label: 'Output', panel: 'OutputPanel' },
];

/** = pages/wasteHeatConfigurator.jsx */
@Component({
  selector: 'app-waste-heat-configurator',
  standalone: true,
  imports: [
    LucideAngularModule,
    HeaderComponent,
    FooterComponent,
    GlobalLayoutComponent,
    StepProgressBarComponent,
    SimulationSidebarComponent,
    SystemParametersComponent,
    SimulationParameterComponent,
    RunSimulationComponent,
  ],
  template: `
    <div class="flex justify-center h-screen bg-black items-center flex-col w-full relative">
      <div class="rounded-lg absolute z-30 h-[88vh] bg-[#181818] top-[3.2rem] left-0">
        <app-global-layout></app-global-layout>
      </div>

      <div class="flex justify-between h-full flex-col w-full">
        <app-header title="PHAROS - Waste Heat Configurator"></app-header>

        <div class="flex justify-between w-full">
          <div class="w-[3%] p-2 cursor-pointer text-white">
            <lucide-icon
              [img]="PanelRight"
              (click)="sidebar.toggle()"
              class="text-white cursor-pointer"
              style="width:24px;height:24px"
            ></lucide-icon>
          </div>

          <span class="bg-white border w-[1px] h-[87vh]"></span>

          <div class="flex flex-col py-2 px-4 gap-2 w-full">
            <!-- Wizard Title -->
            <section class="text-white flex flex-col gap-2 mb-1">
              <div class="flex justify-between items-center">
                <span class="flex items-center gap-2">
                  <img src="/simulationwizard.svg" class="w-5 h-5" />
                  <h1 class="text-white text-[24px] font-semibold">Simulation Wizard</h1>
                </span>
                <span
                  class="flex items-center cursor-pointer p-2 rounded-lg text-base border font-semibold border-[#2D96FF] text-[#2D96FF] gap-2"
                >
                  <lucide-icon [img]="CirclePlus" style="width:24px;height:24px"></lucide-icon>
                  <h1 class="text-base">Create</h1>
                </span>
              </div>
              <div class="flex flex-col">
                <p>
                  <strong>Simulation ID :</strong>
                  <select class="border border-white bg-black rounded-sm p-1 ml-2">
                    <option>SIM0001</option>
                    <option>SIM0002</option>
                    <option>SIM0003</option>
                  </select>
                </p>
                <p>
                  <strong>Description :</strong> TES Charge/Discharge for 100-gallon tank
                  at 50-70 °C
                </p>
              </div>
            </section>

            <!-- Stepper -->
            <app-step-progress-bar [currentStep]="2"></app-step-progress-bar>

            <!-- Main Panel Area -->
            <section class="flex flex-1 gap-4 overflow-hidden">
              <div class="w-72 h-[57vh] bg-[#2b3138] rounded-lg">
                <app-simulation-sidebar
                  [activePanel]="activePanel()"
                  [currentStep]="currentStep()"
                  (panelSelect)="activePanel.set($event)"
                ></app-simulation-sidebar>
              </div>

              <div class="flex-1 h-full">
                @switch (activePanel()) {
                  @case ('System Parameters') {
                    <app-system-parameters></app-system-parameters>
                  }
                  @case ('TES Tank') {
                    <app-system-parameters></app-system-parameters>
                  }
                  @case ('Number of Steps') {
                    <app-simulation-parameter></app-simulation-parameter>
                  }
                  @case ('Simulation Input String') {
                    <app-run-simulation></app-run-simulation>
                  }
                  @case ('OutputPanel') {
                    <div class="text-white">Output Content Here</div>
                  }
                  @default {
                    <div class="text-white h-full w-full flex justify-center items-center">
                      Panel Not Found
                    </div>
                  }
                }
              </div>
            </section>
          </div>
        </div>

        <app-footer></app-footer>
      </div>
    </div>
  `,
})
export class WasteHeatConfiguratorComponent {
  sidebar = inject(SidebarService);

  protected readonly PanelRight = PanelRight;
  protected readonly CirclePlus = CirclePlus;

  currentStep = signal(1);
  completedSteps = signal<number[]>([]);
  activePanel = signal('TES Tank');

  completeCurrentStep() {
    const step = this.currentStep();
    if (!this.completedSteps().includes(step)) {
      this.completedSteps.update((s) => [...s, step]);
    }

    const nextStep = step + 1;
    if (nextStep <= wizardSteps.length) {
      this.currentStep.set(nextStep);
      this.activePanel.set(wizardSteps[nextStep - 1].panel);
    }
  }
}
