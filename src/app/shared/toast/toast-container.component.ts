import { Component, inject } from '@angular/core';
import { LucideAngularModule, Check, X } from 'lucide-angular';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      @for (t of toast.toasts(); track t.id) {
        <div
          class="pointer-events-auto flex items-center gap-2 rounded-lg bg-white text-[#363636] shadow-md px-3 py-2 text-sm font-medium animate-in fade-in slide-in-from-top-2"
        >
          @if (t.type === 'success') {
            <lucide-icon [img]="Check" class="h-4 w-4 text-green-600"></lucide-icon>
          } @else {
            <lucide-icon [img]="X" class="h-4 w-4 text-red-600"></lucide-icon>
          }
          <span>{{ t.message }}</span>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  toast = inject(ToastService);
  protected readonly Check = Check;
  protected readonly X = X;
}
