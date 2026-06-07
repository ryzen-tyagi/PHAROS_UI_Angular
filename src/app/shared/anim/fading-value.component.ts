import { Component, input, signal, effect, OnDestroy } from '@angular/core';

/** Port of hooks/FadingValue.jsx — fade 150ms + flash 400ms on value change. */
@Component({
  selector: 'app-fading-value',
  standalone: true,
  template: `
    <span
      class="font-bold
        text-base sm:text-xs md:text-sm lg:text-md xl:text-md
        mt-1 transition-all duration-300 ease-in-out"
      [class]="(fade() ? 'opacity-50' : 'opacity-100') + ' ' + (flash() ? 'scale-110' : 'scale-100')"
      [style.color]="flash() ? color() : '#ffffff'"
    >
      {{ display() }}
      <span class="ml-1 text-base sm:text-xs md:text-sm lg:text-md xl:text-md opacity-80">
        {{ unit() }}
      </span>
    </span>
  `,
})
export class FadingValueComponent implements OnDestroy {
  value = input<any>();
  unit = input<string>('');
  color = input<string>('#ffffff');

  protected display = signal<any>(undefined);
  protected fade = signal(false);
  protected flash = signal(false);

  private timeout1?: any;
  private timeout2?: any;

  constructor() {
    let first = true;
    effect(() => {
      const v = this.value();
      if (first) {
        this.display.set(v);
        first = false;
        return;
      }
      if (v !== this.display()) {
        this.fade.set(true);
        this.flash.set(true);

        if (this.timeout1) clearTimeout(this.timeout1);
        if (this.timeout2) clearTimeout(this.timeout2);

        this.timeout1 = setTimeout(() => {
          this.display.set(v);
          this.fade.set(false);
        }, 150);

        this.timeout2 = setTimeout(() => {
          this.flash.set(false);
        }, 400);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timeout1) clearTimeout(this.timeout1);
    if (this.timeout2) clearTimeout(this.timeout2);
  }
}
