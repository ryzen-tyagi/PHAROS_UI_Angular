import { Component, inject, input, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { KpiService } from '../../state/kpi.service';
import { ToastService } from '../toast/toast.service';
import { modeStyles } from '../util/helper';

/** Port of hooks/DateTImePicker.jsx — from/to date+time range, Apply fetches
 *  PPR/HRF/Temp history with UTC ISO strings; runs once on init. */
@Component({
  selector: 'app-date-time-picker',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="flex items-center justify-between w-full space-x-2 p-2 bg-[#2a2a2a] rounded text-sm text-gray-300">
      <div class="flex items-center gap-2">
        <span class="font-semibold text-white">Select Date</span>
        <h1 class="font-semibold text-white">From:</h1>
        <input
          type="date"
          [(ngModel)]="fromDate"
          class="bg-[#3b3b3b] text-white p-1 rounded border border-gray-600"
        />
        <input
          type="time"
          [(ngModel)]="fromTime"
          class="bg-[#3b3b3b] text-white p-1 rounded border border-gray-600"
        />
        <h1 class="font-semibold text-white">To:</h1>
        <input
          type="date"
          [(ngModel)]="toDate"
          class="bg-[#3b3b3b] text-white p-1 rounded border border-gray-600"
        />
        <input
          type="time"
          [(ngModel)]="toTime"
          class="bg-[#3b3b3b] text-white p-1 rounded border border-gray-600"
        />
        <button
          (click)="handleApply()"
          class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
        >
          Apply
        </button>
      </div>
      <div class="flex justify-end">
        <span
          [class]="modeBadgeClass()"
        >
          ● {{ currentMode() }} Mode
        </span>
      </div>
    </div>
  `,
})
export class DateTimePickerComponent implements OnInit {
  currentMode = input<string>('');

  private kpi = inject(KpiService);
  private toast = inject(ToastService);

  private today = new Date().toISOString().split('T')[0];
  fromDate = this.today;
  fromTime = '00:00';
  toDate = this.today;
  toTime = '23:59';

  handleApply(): void {
    const fromLocal = new Date(`${this.fromDate}T${this.fromTime}:00`);
    const toLocal = new Date(`${this.toDate}T${this.toTime}:00`);

    const fromUTC = fromLocal.toISOString();
    const toUTC = toLocal.toISOString();

    console.log('Applying Filter (UTC):', { from: fromUTC, to: toUTC });

    this.kpi.fetchPprHistory({ fromDate: fromUTC, toDate: toUTC, limit: 500 });
    this.kpi.fetchHrfHistory({ fromDate: fromUTC, toDate: toUTC, limit: 100 });
    this.kpi.fetchTempHistory({ number: 2, fromDate: fromUTC, toDate: toUTC, limit: 200 });

    if (this.currentMode() === 'Live') {
      this.toast.success('Filter Applied');
    }
  }

  modeBadgeClass(): string {
    const s = modeStyles[this.currentMode()];
    return [
      s?.text ?? '',
      s?.border ?? '',
      s?.bg ?? '',
      'rounded-lg px-3 py-1 text-sm font-medium',
    ].join(' ');
  }

  ngOnInit(): void {
    this.handleApply();
  }
}
