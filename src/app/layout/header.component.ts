import { Component, inject, signal, input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, House, Power, User, Clock } from 'lucide-angular';
import { AuthService } from '../state/auth.service';
import { ToastService } from '../shared/toast/toast.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './header.component.html',
  host: { class: 'block w-full' },
})
export class HeaderComponent implements OnInit, OnDestroy {
  title = input<string>('');
  private router = inject(Router);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  protected readonly House = House;
  protected readonly Power = Power;
  protected readonly User = User;
  protected readonly Clock = Clock;

  now = signal(new Date());
  showConfirm = signal(false);
  private timer?: any;

  ngOnInit() {
    this.timer = setInterval(() => this.now.set(new Date()), 1000);
  }
  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  goHome() {
    this.router.navigate(['/v1/landing-page']);
  }

  confirmLogout() {
    this.showConfirm.set(false);
    this.auth.logout();
    this.toast.success('Logged out successfully');
    this.router.navigate(['/']);
  }

  formatTime(d: Date): string {
    return d.toLocaleTimeString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    });
  }
  formatDate(d: Date): string {
    return d.toLocaleDateString('en-GB', {
      timeZone: 'America/Los_Angeles', day: '2-digit', month: '2-digit', year: '2-digit',
    });
  }
  dayName(d: Date): string {
    return d.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', weekday: 'long' });
  }
}
