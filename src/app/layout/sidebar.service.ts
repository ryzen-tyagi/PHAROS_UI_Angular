import { Injectable, signal } from '@angular/core';

const COOKIE = 'sidebar_state';

/** = components/ui/sidebar.tsx SidebarProvider (open state + cookie persistence). */
@Injectable({ providedIn: 'root' })
export class SidebarService {
  open = signal<boolean>(this.read());

  setOpen(v: boolean) {
    this.open.set(v);
    this.persist(v);
  }
  toggle() {
    this.setOpen(!this.open());
  }

  private read(): boolean {
    const m = document.cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
    return m ? m[1] === 'true' : false; // defaultOpen={false}
  }
  private persist(v: boolean) {
    document.cookie = `${COOKIE}=${v}; path=/; max-age=${60 * 60 * 24 * 7}`;
  }
}
