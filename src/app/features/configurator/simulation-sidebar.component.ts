import {
  Component,
  EventEmitter,
  Output,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';
import { LucideAngularModule, ChevronDown, ChevronUp } from 'lucide-angular';

interface SidebarNode {
  title: string;
  icon: string;
  children?: SidebarNode[];
  active?: boolean;
}

interface WizardStep {
  id: number;
  label: string;
  panel: string;
}

// = utils/Utils.js wasteHeatConfiguratorSidebar
const wasteHeatConfiguratorSidebar: SidebarNode[] = [
  {
    title: 'System Parameters',
    icon: '/whc.svg',
    children: [
      {
        title: 'Hardware Set up',
        icon: '/smi.svg',
        children: [
          { title: 'IT Rack Power', icon: '/icons/it.svg' },
          { title: 'Waste Heat Input', icon: '/icons/waste.svg' },
          { title: 'TES Tank', icon: '/icons/tes.svg', active: true },
          { title: 'TER', icon: '/icons/ter.svg' },
        ],
      },
      {
        title: 'External Conditions',
        icon: '/smi.svg',
        children: [
          { title: 'Aggregate Waste Heat Input', icon: '/icons/agg.svg' },
          { title: 'Weather Conditions', icon: '/icons/weather.svg' },
          { title: 'Control Signals', icon: '/icons/control.svg' },
        ],
      },
      {
        title: 'Internal Conditions',
        icon: '/smi.svg',
        children: [{ title: 'System State', icon: '/icons/state.svg' }],
      },
      {
        title: 'Other Attributes',
        icon: '/smi.svg',
        children: [],
      },
    ],
  },
  {
    title: 'Simulation Parameters',
    icon: '/whc.svg',
    children: [
      { title: 'Number of Steps', icon: '/smi.svg', children: [] },
      { title: 'Step Duration', icon: '/smi.svg', children: [] },
    ],
  },
  {
    title: 'Run',
    icon: '/whc.svg',
    children: [{ title: 'Simulation Input String', icon: '/smi.svg', children: [] }],
  },
];

// = utils/Utils.js wizardSteps
const wizardSteps: WizardStep[] = [
  { id: 1, label: 'Start', panel: 'StartPanel' },
  { id: 2, label: 'TES Tank', panel: 'TES Tank' },
  { id: 3, label: 'Number of Steps', panel: 'Number of Steps' },
  { id: 4, label: 'Simulation Input String', panel: 'Simulation Input String' },
  { id: 5, label: 'Output', panel: 'OutputPanel' },
];

/**
 * = components/simulationSidebar.jsx SidebarItem (recursive) + Leaf.
 * Shared openMap is held by the parent SimulationSidebarComponent and passed by reference.
 */
@Component({
  selector: 'app-sidebar-item',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="text-gray-200 flex flex-col gap-1">
      <button
        (click)="toggle()"
        class="flex items-center gap-2 px-2 py-1.5 rounded-md w-full text-base font-semibold transition"
        [class]="isActive() ? 'bg-[#3b4148]' : 'hover:bg-gray-700/40'"
        [style.paddingLeft.px]="level() * 16 + 8"
      >
        @if (hasChildren()) {
          @if (isOpen()) {
            <lucide-icon [img]="ChevronUp" class="text-[#2D96FF]" style="width:18px;height:18px"></lucide-icon>
          } @else {
            <lucide-icon [img]="ChevronDown" class="text-[#2D96FF]" style="width:18px;height:18px"></lucide-icon>
          }
        }

        <img [src]="item().icon" class="w-4 h-4 opacity-70" />
        {{ item().title }}
      </button>

      @if (hasChildren() && isOpen()) {
        <div class="flex flex-col font-medium gap-1">
          @for (child of item().children; track child.title) {
            <div class="ml-4">
              @if (child.children) {
                <app-sidebar-item
                  [item]="child"
                  [level]="level() + 1"
                  [activePanel]="activePanel()"
                  [openMap]="openMap()"
                  (panelSelect)="panelSelect.emit($event)"
                  (toggleOpen)="toggleOpen.emit($event)"
                ></app-sidebar-item>
              } @else {
                <!-- Leaf -->
                <div
                  (click)="panelSelect.emit(child.title)"
                  class="flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] cursor-pointer"
                  [class]="activePanel() === child.title ? 'bg-[#3b4148]' : 'hover:bg-gray-700/40'"
                  [style.paddingLeft.px]="(level() + 1) * 16 + 8"
                >
                  <img [src]="child.icon" class="w-4 h-4" />
                  <span>{{ child.title }}</span>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SidebarItemComponent {
  item = input.required<SidebarNode>();
  level = input<number>(0);
  activePanel = input<string>('');
  openMap = input.required<Record<string, boolean>>();

  @Output() panelSelect = new EventEmitter<string>();
  @Output() toggleOpen = new EventEmitter<string>();

  protected readonly ChevronDown = ChevronDown;
  protected readonly ChevronUp = ChevronUp;

  hasChildren = computed(() => {
    const c = this.item().children;
    return !!c && c.length > 0;
  });
  isOpen = computed(() => !!this.openMap()[this.item().title]);
  isActive = computed(() => this.activePanel() === this.item().title);

  toggle() {
    if (!this.hasChildren()) {
      this.panelSelect.emit(this.item().title);
      return;
    }
    this.toggleOpen.emit(this.item().title);
  }
}

/** = components/simulationSidebar.jsx SimulationSidebar */
@Component({
  selector: 'app-simulation-sidebar',
  standalone: true,
  imports: [SidebarItemComponent],
  template: `
    <div
      class="w-72 !max-h-[57vh] overflow-y-scroll custom-scrollbar border-[#3a3f47] p-2 text-gray-200 select-none flex flex-col gap-1"
    >
      @for (item of filteredSidebar(); track item.title) {
        <app-sidebar-item
          [item]="item"
          [level]="0"
          [activePanel]="activePanel()"
          [openMap]="openMap()"
          (panelSelect)="panelSelect.emit($event)"
          (toggleOpen)="onToggleOpen($event)"
        ></app-sidebar-item>
      }
    </div>
  `,
})
export class SimulationSidebarComponent {
  currentStep = input<number>(1);
  activePanel = input<string>('');

  @Output() panelSelect = new EventEmitter<string>();

  // Open-state map; owned here, mutated immutably so child computeds re-evaluate.
  openMap = signal<Record<string, boolean>>({});

  onToggleOpen(title: string) {
    this.openMap.update((m) => ({ ...m, [title]: !m[title] }));
  }

  allowedPanels = computed(() =>
    wizardSteps.filter((step) => step.id <= this.currentStep()).map((step) => step.panel)
  );

  filteredSidebar = computed(() =>
    wasteHeatConfiguratorSidebar.filter((item) =>
      item.children ? true : this.allowedPanels().includes(item.title)
    )
  );

  constructor() {
    // Auto-open parents of the active panel (= React useEffect merging into prev).
    effect(() => {
      const active = this.activePanel();
      if (!active) return;
      const sidebar = this.filteredSidebar();

      const additions: Record<string, boolean> = {};
      const traverse = (items: SidebarNode[], parents: string[] = []) => {
        for (const item of items) {
          if (item.title === active) {
            parents.forEach((title) => (additions[title] = true));
          }
          if (item.children?.length) {
            traverse(item.children, [...parents, item.title]);
          }
        }
      };
      traverse(sidebar);
      if (Object.keys(additions).length) {
        this.openMap.update((prev) => ({ ...prev, ...additions }));
      }
    });
  }
}
