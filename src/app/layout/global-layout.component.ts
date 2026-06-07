import { Component, inject } from '@angular/core';
import { AppSidebarComponent } from './app-sidebar.component';
import { SidebarService } from './sidebar.service';

/** = components/GlobalLayout.jsx — collapsible sidebar container. */
@Component({
  selector: 'app-global-layout',
  standalone: true,
  imports: [AppSidebarComponent],
  template: `
    <div class="flex relative h-[88%]">
      <div
        class="h-full transition-all duration-300 overflow-hidden"
        [class]="sidebar.open() ? 'w-[19.5vw]' : 'w-0'"
      >
        <app-app-sidebar></app-app-sidebar>
      </div>
    </div>
  `,
})
export class GlobalLayoutComponent {
  sidebar = inject(SidebarService);
}
