import {
  Component,
  inject,
  signal,
  input,
  ElementRef,
  HostListener,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  X,
  CircleArrowDown,
  CircleArrowUp,
  Search,
  Plus,
} from 'lucide-angular';
import { SidebarService } from './sidebar.service';

/** Sidebar action (port of operationDashSidebar item.actions). */
export interface SidebarAction {
  /** which lucide icon to render */
  icon: 'search' | 'plus';
  type?: 'search';
  onClick?: () => void;
}

/** Sidebar nav item (port of utils/Utils.js operationDashSidebar entries). */
export interface SidebarItem {
  type?: 'heading';
  title: string;
  icon: string;
  url?: string;
  actions?: SidebarAction[];
  children?: SidebarItem[];
}

/** Grouped block (heading + its following items). */
export interface SidebarGroup extends SidebarItem {
  children: SidebarItem[];
}

/** Port of utils/Utils.js `operationDashSidebar`. */
export const operationDashSidebar: SidebarItem[] = [
  {
    type: 'heading',
    title: 'Operation Dashboard',
    icon: '/operationdash.svg',
  },
  {
    title: 'KPI',
    icon: '/hrf.svg',
    children: [
      { title: 'Heat Recovery Factor', icon: '/hrf.svg', url: '/v1/kpi/heat_recovery_factor' },
      { title: 'TES Discharge', icon: '/tes.svg', url: '/v1/kpi/TES_discharge' },
      { title: 'Net Power Generated', icon: '/nps.svg', url: '/v1/kpi/parasitic_power_ratio' },
    ],
  },
  {
    title: 'Live View',
    icon: '/hrf.svg',
    children: [
      { title: 'Live PHAROS System', icon: '/lps.svg', url: '/v1/kpi/sfg' },
      { title: 'Live TES', icon: '/tes2.svg', url: '/v1/kpi/tes' },
    ],
  },

  // ------- SECOND MAIN HEADING -------- //
  {
    type: 'heading',
    title: 'Waste Heat Configurator',
    icon: '/whc.svg',
  },
  {
    title: 'Simulation Wizard',
    icon: '/hrf.svg',
    actions: [
      { icon: 'search', type: 'search' },
      { icon: 'plus', onClick: () => console.log('add new') },
    ],
    children: [
      { title: 'SIM0001', icon: '/smi.svg', url: '#' },
      { title: 'SIM0002', icon: '/smi.svg', url: '#' },
      { title: 'SIM0003', icon: '/smi.svg', url: '#' },
    ],
  },
  {
    title: 'Digital Configurator',
    icon: '/icons/digitalconfi.svg',
    url: '/v1/kpi/waste_heat_configurator',
    children: [],
  },
];

//--------------- SUB DROPDOWN ------------------
@Component({
  selector: 'app-sidebar-sub-dropdown',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  template: `
    @if (isDirectLink()) {
      <a
        [href]="item().url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-2 p-2 rounded hover:bg-[#333] text-nowrap"
      >
        <img [src]="item().icon" class="w-4 h-4" />
        <span class="text-[#E0F1FF]">{{ item().title }}</span>
      </a>
    } @else {
      <div class="flex flex-col gap-2">
        <!-- SUB HEADING WITH ARROW (same style as main) -->
        <div
          class="flex items-center justify-between cursor-pointer p-2 rounded gap-2 hover:bg-[#333]"
          (click)="toggle()"
        >
          <div class="flex items-center text-nowrap gap-2">
            <span class="text-[#2D96FF]">
              @if (open()) {
                <lucide-icon [img]="CircleArrowUp" [size]="18"></lucide-icon>
              } @else {
                <lucide-icon [img]="CircleArrowDown" [size]="18"></lucide-icon>
              }
            </span>

            <img [src]="item().icon" class="w-4 h-4" />
            <span class="text-[#E0F1FF]">{{ item().title }}</span>
          </div>

          <!-- ACTION BUTTONS -->
          <div class="flex items-center gap-2">
            @for (action of item().actions; track $index) {
              <button
                class="p-1 bg-blue-600 hover:bg-blue-700 rounded"
                (click)="onAction($event, action)"
              >
                @if (action.icon === 'search') {
                  <lucide-icon [img]="Search" class="w-4 h-4"></lucide-icon>
                } @else {
                  <lucide-icon [img]="Plus" class="w-4 h-4"></lucide-icon>
                }
              </button>
            }
          </div>
        </div>

        <!-- CHILD LINKS -->
        @if (open()) {
          <div class="ml-8 flex flex-col gap-2">
            @if (showSearch()) {
              <input
                type="text"
                class="text-black rounded px-2 py-1 mb-2"
                placeholder="Search..."
                [(ngModel)]="query"
              />
            }

            @for (child of filteredChildren(); track child.title) {
              <a
                [href]="child.url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 text-sm hover:bg-gray-700 rounded-sm p-1"
              >
                <img [src]="child.icon" class="w-4 h-4" />
                {{ child.title }}
              </a>
            }
          </div>
        }
      </div>
    }
  `,
})
export class SidebarSubDropdownComponent {
  item = input.required<SidebarItem>();

  protected readonly CircleArrowUp = CircleArrowUp;
  protected readonly CircleArrowDown = CircleArrowDown;
  protected readonly Search = Search;
  protected readonly Plus = Plus;

  protected open = signal(false);
  protected showSearch = signal(false);
  protected query = '';

  private host = inject(ElementRef);

  isDirectLink(): boolean {
    const it = this.item();
    return !!it.url && (!it.children || it.children.length === 0);
  }

  filteredChildren(): SidebarItem[] {
    const q = this.query.toLowerCase();
    return (this.item().children ?? []).filter((c) =>
      c.title.toLowerCase().includes(q),
    );
  }

  toggle(): void {
    this.open.update((p) => !p);
    this.showSearch.set(false);
    this.query = '';
  }

  onAction(e: Event, action: SidebarAction): void {
    e.stopPropagation();
    if (action.type === 'search') {
      this.open.set(true);
      this.showSearch.update((p) => !p);
    }
    if (action.onClick) action.onClick();
  }

  // CLOSE search when clicking outside
  @HostListener('document:mousedown', ['$event'])
  onDocMouseDown(e: MouseEvent): void {
    if (!this.host.nativeElement.contains(e.target)) {
      this.showSearch.set(false);
      this.query = '';
    }
  }
}

//------------------- MAIN SECTION ----------------------------
@Component({
  selector: 'app-sidebar-main-dropdown',
  standalone: true,
  imports: [LucideAngularModule, SidebarSubDropdownComponent],
  template: `
    <div class="flex flex-col gap-2">
      <!-- MAIN HEADING WITH ARROW -->
      <div
        class="flex items-center justify-start cursor-pointer p-2 rounded gap-2 hover:bg-[#333] text-nowrap"
        (click)="toggle()"
      >
        <span class="text-[#2D96FF]">
          @if (open()) {
            <lucide-icon [img]="CircleArrowUp" [size]="24"></lucide-icon>
          } @else {
            <lucide-icon [img]="CircleArrowDown" [size]="24"></lucide-icon>
          }
        </span>

        <div class="flex items-center gap-2 text-[#AED6FD] font-semibold">
          <img [src]="group().icon" class="w-5 h-5" />
          {{ group().title }}
        </div>
      </div>

      <!-- CHILD SECTIONS -->
      @if (open()) {
        <div class="ml-6 flex flex-col gap-2">
          @for (item of group().children; track $index) {
            <app-sidebar-sub-dropdown [item]="item"></app-sidebar-sub-dropdown>
          }
        </div>
      }
    </div>
  `,
})
export class SidebarMainDropdownComponent {
  group = input.required<SidebarGroup>();

  protected readonly CircleArrowUp = CircleArrowUp;
  protected readonly CircleArrowDown = CircleArrowDown;

  protected open = signal(false);

  toggle(): void {
    this.open.update((p) => !p);
  }
}

//------------------- APP SIDEBAR ----------------------------
/** Port of components/AppSidebar.jsx — grouped/collapsible/searchable nav tree. */
@Component({
  selector: 'app-app-sidebar',
  standalone: true,
  imports: [LucideAngularModule, SidebarMainDropdownComponent],
  template: `
    <div class="w-full rounded-e-lg h-full text-white overflow-y-auto">
      <div class="bg-[#181818] min-h-[50vh] p-2 gap-2 flex flex-col">
        <!-- CLOSE BUTTON -->
        <button
          (click)="sidebar.setOpen(false)"
          class="text-white text-lg w-full flex justify-end"
        >
          <lucide-icon [img]="X" [size]="24"></lucide-icon>
        </button>

        <!-- MAIN GROUP DROPDOWNS -->
        @for (group of grouped; track $index) {
          <app-sidebar-main-dropdown [group]="group"></app-sidebar-main-dropdown>
        }
      </div>
    </div>
  `,
})
export class AppSidebarComponent {
  protected sidebar = inject(SidebarService);
  protected readonly X = X;

  /** GROUP SIDES INTO BLOCKS BASED ON type:"heading" */
  protected grouped: SidebarGroup[] = (() => {
    const grouped: SidebarGroup[] = [];
    let currentGroup: SidebarGroup | null = null;
    operationDashSidebar?.forEach((item) => {
      if (item.type === 'heading') {
        if (currentGroup) grouped.push(currentGroup);
        currentGroup = { ...item, children: [] };
      } else {
        currentGroup?.children.push(item);
      }
    });
    if (currentGroup) grouped.push(currentGroup);
    return grouped;
  })();
}
