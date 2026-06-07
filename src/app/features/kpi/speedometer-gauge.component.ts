import { Component, computed, input } from '@angular/core';
import * as Highcharts from 'highcharts';
// highcharts-more provides the `gauge`/extra series types. In Highcharts v12 the
// module self-registers on import (no `HighchartsMore(Highcharts)` call needed).
import 'highcharts/highcharts-more';
import { HighchartsChartModule } from 'highcharts-angular';

/** Port of KPIs/speedometerGauge.jsx */
@Component({
  selector: 'app-speedometer-gauge',
  standalone: true,
  imports: [HighchartsChartModule],
  template: `
    <highcharts-chart
      [Highcharts]="Highcharts"
      [options]="chartOptions()"
      [style.height]="height()"
      [style.width]="width()"
      style="display:block"
    ></highcharts-chart>
  `,
})
export class SpeedometerGaugeComponent {
  Highcharts: typeof Highcharts = Highcharts;

  title = input<string>('');
  value = input<number>(0);
  minValue = input<number>(0);
  maxValue = input<number>(0);
  pointerValue = input<number>(0);
  gradient = input<any[][]>([]);
  height = input<string>('');
  width = input<string>('');
  fontSize = input<string>('');
  unit = input<string>('');

  chartOptions = computed<Highcharts.Options>(() => {
    const minValue = this.minValue();
    const maxValue = this.maxValue();
    const value = this.value();
    const gradient = this.gradient();
    const fontSize = this.fontSize();
    const title = this.title();
    const unit = this.unit();

    // Dynamic plot bands: if there's a negative side, use two colors
    const plotBands =
      minValue < 0
        ? [
            {
              from: minValue,
              to: 0,
              color: {
                linearGradient: { x1: 0, x2: 1, y1: 0, y2: 0 },
                stops: [
                  [0, '#FA000F'],
                  [1, '#FA000F'],
                ],
              },
              outerRadius: '100%',
              innerRadius: '70%',
            },
            {
              from: 0,
              to: maxValue,
              color: {
                linearGradient: { x1: 0, x2: 1, y1: 0, y2: 0 },
                stops: [
                  [0, '#06B211'],
                  [1, '#06B211'],
                ],
              },
              outerRadius: '100%',
              innerRadius: '70%',
            },
          ]
        : [
            {
              from: minValue,
              to: value,
              color: {
                linearGradient: { x1: 0, x2: 1, y1: 0, y2: 0 },
                stops: gradient,
              },
              outerRadius: '100%',
              innerRadius: '70%',
            },
          ];

    const textStyle = {
      color: '#fff',
      fontSize,
      fontWeight: 'bold',
    };

    const options: Highcharts.Options = {
      chart: {
        type: 'gauge',
        backgroundColor: 'transparent',
        animation: true,
        spacingTop: 10,
        spacingBottom: 10,
        spacingLeft: 10,
        spacingRight: 10,
      },
      title: { text: undefined },
      pane: {
        startAngle: -90,
        endAngle: 90,
        center: ['50%', '50%'],
        size: '80%',
        background: [
          {
            outerRadius: '100%',
            innerRadius: '70%',
            backgroundColor: '#3a3a3a',
            borderWidth: 0,
            shape: 'arc',
          },
        ],
      },
      yAxis: ({
        min: minValue,
        max: maxValue,
        tickPosition: 'inside',
        tickColor: '#ffffff',
        tickLength: 5,
        tickInterval: (maxValue - minValue) / 4,
        labels: {
          enabled: true,
          style: textStyle,
          distance: 15,
          formatter: function (this: any) {
            if (this.value === minValue) return `${minValue}`;
            if (this.value === 0) return '0';
            if (this.value === maxValue) return `${maxValue}`;
            return '';
          },
        },
        lineWidth: 0,
        minorTickInterval: null,
        gridLineWidth: 0,
        plotBands: plotBands as any,
      }) as any,

      series: [
        {
          type: 'gauge',
          name: title,
          data: [value],
          tooltip: {
            valueSuffix: ` ${unit}`,
          },
          dial: {
            radius: '50%',
            backgroundColor: '#ffffff',
            baseWidth: 6,
            topWidth: 2,
            baseLength: '0%',
            rearLength: '0%',
          },
          pivot: { backgroundColor: '#ffffff', radius: 0 },
          dataLabels: {
            format: `{y} ${unit}`,
            borderWidth: 0,
            style: textStyle,
            y: 10,
          },
          animation: { duration: 400, easing: 'easeOutBounce' },
        } as any,
      ],
      tooltip: { enabled: false },
      credits: { enabled: false },
    };

    return options;
  });
}
