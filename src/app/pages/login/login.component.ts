import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Mail, Lock, Eye, EyeOff } from 'lucide-angular';
import { AuthService } from '../../state/auth.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  protected readonly Mail = Mail;
  protected readonly Lock = Lock;
  protected readonly Eye = Eye;
  protected readonly EyeOff = EyeOff;

  showPassword = signal(false);
  email = '';
  password = '';
  loading = this.auth.loading;

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  async handleLogin(e: Event) {
    e.preventDefault();
    if (!this.email || !this.password) {
      this.toast.error('Please enter both email and password!');
      return;
    }
    try {
      await this.auth.login(this.email, this.password);
      const msg = this.auth.message();
      if (this.auth.user() && msg) {
        this.toast.success(msg);
        setTimeout(() => this.router.navigate(['/v1/landing-page']), 1000);
        this.auth.clearMessages();
      }
    } catch {
      const err = this.auth.error();
      if (err) this.toast.error(err);
      this.auth.clearMessages();
    }
  }
}
