import { Component, input, signal, effect, OnDestroy } from '@angular/core';

/** Port of hooks/AnimatedValue.jsx — 300ms orange flash + scale on value change. */
@Component({
  selector: 'app-animated-value',
  standalone: true,
  template: `
    <span
      class="font-bold text-lg mt-1 transition-all duration-300"
      [class]="flash() ? 'scale-125 text-orange-400' : 'text-white'"
      [style.color]="color()"
    >
      {{ value() }}
    </span>
  `,
})
export class AnimatedValueComponent implements OnDestroy {
  value = input<any>();
  color = input<string>('#fff');

  protected flash = signal(false);
  private prev: any;
  private timeout?: any;

  constructor() {
    let first = true;
    effect(() => {
      const v = this.value();
      if (first) {
        this.prev = v;
        first = false;
        return;
      }
      if (v !== this.prev) {
        this.flash.set(true);
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => this.flash.set(false), 300);
        this.prev = v;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timeout) clearTimeout(this.timeout);
  }
}
