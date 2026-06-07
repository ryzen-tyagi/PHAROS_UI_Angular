import { Component, computed, input } from '@angular/core';

interface WizardStep {
  id: number;
  label: string;
  panel: string;
}

/** = components/stepProgressBar.jsx */
@Component({
  selector: 'app-step-progress-bar',
  standalone: true,
  template: `
    <div class="w-full bg-[#D7E4F2] p-4 rounded-xl">
      <div class="relative flex justify-between items-center w-full">
        <!-- Progress Line Background -->
        <div class="absolute top-[100%] left-0 w-full h-2 mt-1 bg-[#D0D7E2] rounded-full -translate-y-1/2"></div>
        <!-- Progress Fill -->
        <div
          class="absolute top-[100%] left-0 h-2 mt-1 bg-[#117DFF] rounded-full -translate-y-1/2"
          [style.width.%]="progressPercent()"
        ></div>

        <!-- Steps -->
        @for (step of wizardSteps; track step.id; let index = $index) {
          <div class="flex flex-col items-center z-10 w-full">
            <div
              class="flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-bold"
              [class]="circleClass(index)"
            >
              {{ pad(step.id) }}
            </div>
            <div class="mt-1 text-sm font-semibold text-black">
              {{ step.label }}
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class StepProgressBarComponent {
  currentStep = input<number>(1);

  readonly wizardSteps: WizardStep[] = [
    { id: 1, label: 'Start', panel: 'StartPanel' },
    { id: 2, label: 'TES Tank', panel: 'TES Tank' },
    { id: 3, label: 'Number of Steps', panel: 'Number of Steps' },
    { id: 4, label: 'Simulation Input String', panel: 'Simulation Input String' },
    { id: 5, label: 'Output', panel: 'OutputPanel' },
  ];

  progressPercent = computed(
    () => ((this.currentStep() - 1) / (this.wizardSteps.length - 1)) * 100
  );

  circleClass(index: number): string {
    const isCompleted = index + 0 < this.currentStep();
    const isActive = index + 1 === this.currentStep();
    if (isCompleted) return 'bg-[#117DFF] border-[#117DFF] border-dotted text-black';
    if (isActive) return 'border-[#117DFF] border-dotted text-[#117DFF]';
    return 'border-[#2D96FF] border-dotted text-black';
  }

  pad(id: number): string {
    return id.toString().padStart(2, '0');
  }
}
