import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';
import * as d3 from 'd3';

interface Frame {
  time: number;
  temps: number[];
}

/** Port of KPIs/TES.jsx (TESAnimationD3). */
@Component({
  selector: 'app-tes',
  standalone: true,
  template: `
    <div class="relative w-full bg-black p-4 md:p-6 rounded-xl shadow-2xl">
      <!-- SVG fills the area -->
      <svg #svg class="drop-shadow-xl block h-[71vh] w-[88vw]"></svg>

      <!-- Floating controls (overlay) -->
      @if (data().length > 0) {
        <div class="absolute right-4 bottom-4 md:right-6 md:bottom-6">
          <div
            class="backdrop-blur-md bg-black/50 border border-white/10 rounded-xl shadow-xl p-2 md:p-3 flex flex-col gap-3 w-[250px] md:w-[330px]"
          >
            <!-- Top row: Play/Pause + time + expand -->
            <div class="flex items-center justify-between">
              <button
                (click)="isPlaying.set(!isPlaying())"
                class="px-4 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                {{ isPlaying() ? '⏸ Pause' : '▶️ Play' }}
              </button>

              <div
                class="px-3 py-2 rounded-md bg-gray-800 text-blue-300 font-bold text-sm md:text-base"
              >
                {{ data()[frame()].time.toFixed(2) }} s
              </div>

              <button
                (click)="controlsOpen.set(!controlsOpen())"
                class="px-3 py-2 rounded-lg text-gray-200 bg-gray-700 hover:bg-gray-600 transition"
                [title]="controlsOpen() ? 'Hide slider' : 'Show slider'"
              >
                {{ controlsOpen() ? '▴' : '▾' }}
              </button>
            </div>

            <!-- Slider (collapsible) -->
            @if (controlsOpen()) {
              <div class="w-full">
                <input
                  type="range"
                  [min]="0"
                  [max]="data().length - 1"
                  [value]="frame()"
                  (input)="onSlider($event)"
                  class="w-full h-3 accent-blue-500 cursor-pointer"
                  [style.background]="sliderBackground()"
                />
                <div
                  class="flex justify-between mt-2 text-xs md:text-sm text-gray-300"
                >
                  <span>0.0 s</span>
                  <span>{{ data()[data().length - 1].time.toFixed(2) }} s</span>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class TesComponent implements AfterViewInit, OnDestroy {
  height = input<string | number>('');
  width = input<string | number>('');

  @ViewChild('svg') svgRef!: ElementRef<SVGSVGElement>;

  data = signal<Frame[]>([]);
  frame = signal(0);
  isPlaying = signal(true);
  controlsOpen = signal(false);

  sliderBackground = computed(() => {
    const len = this.data().length;
    if (len < 2) return '';
    const pct = (this.frame() / (len - 1)) * 100;
    return `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${pct}%, #4b5563 ${pct}%, #4b5563 100%)`;
  });

  private playInterval: ReturnType<typeof setInterval> | null = null;
  private viewReady = false;

  constructor() {
    // Initial D3 setup + render (React: effect on [data])
    effect(() => {
      const data = this.data();
      if (!this.viewReady || !data.length) return;
      this.initRender(data);
    });

    // Animate frames (React: effect on [data, isPlaying])
    effect(() => {
      const data = this.data();
      const playing = this.isPlaying();
      if (this.playInterval !== null) {
        clearInterval(this.playInterval);
        this.playInterval = null;
      }
      if (!data.length || !playing) return;
      this.playInterval = setInterval(() => {
        this.frame.set((this.frame() + 1) % data.length);
      }, 600);
    });

    // Update visualization on frame change (React: effect on [frame, data])
    effect(() => {
      const data = this.data();
      const frame = this.frame();
      if (!this.viewReady || !data.length) return;
      this.updateFrame(data, frame);
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    // Load CSV data
    d3.text('/assets/tes_data2.csv')
      .then((text) => {
        const rows = text
          .trim()
          .split('\n')
          .map((r) => r.split(','));
        const headers = rows[0];
        const timeIndex = headers.indexOf('Time_s');
        const layerIndices = headers
          .map((h, i) => (h.includes('Layer') ? i : null))
          .filter((i): i is number => i !== null);
        const parsed: Frame[] = rows.slice(1).map((row) => ({
          time: +row[timeIndex],
          temps: layerIndices.map((i) => +row[i]),
        }));
        this.data.set(parsed);
      })
      .catch((err) => console.error('Failed to load CSV:', err));
  }

  ngOnDestroy(): void {
    if (this.playInterval !== null) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
    if (this.svgRef) {
      d3.select(this.svgRef.nativeElement).selectAll('*').interrupt();
    }
  }

  onSlider(e: Event): void {
    this.isPlaying.set(false);
    this.frame.set(Number((e.target as HTMLInputElement).value));
  }

  private initRender(data: Frame[]): void {
    const svg = d3.select(this.svgRef.nativeElement);
    const margin = { top: 80, right: 140, bottom: 80, left: 90 };
    const width = 700;
    const height = 600;
    const tankWidth = 570;

    svg.attr(
      'viewBox',
      `0 0 ${width + margin.left + margin.right} ${
        height + margin.top + margin.bottom
      }`
    );

    // Clear previous content
    svg.selectAll('*').remove();

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create color scale - matching the reference image colors
    const allTemps = data.flatMap((d) => d.temps);
    const tempExtent = d3.extent(allTemps) as [number, number];

    const colorScale = d3
      .scaleSequential()
      .domain([tempExtent[1], tempExtent[0]])
      .interpolator(d3.interpolateRdYlBu);

    // Y scale for tank height
    const yScale = d3.scaleLinear().domain([0, 1.6]).range([height, 0]);

    const updateFrame = (frameIndex: number): void => {
      const temps = data[frameIndex].temps;
      const layerHeight = height / temps.length;

      // --- TANK LAYERS ---
      const layers = g.selectAll<SVGRectElement, number>('rect.layer').data(temps);

      layers.exit().remove();

      const layersEnter = layers
        .enter()
        .append('rect')
        .attr('class', 'layer')
        .attr('x', 0)
        .attr('width', tankWidth)
        .attr('y', (_, i) => height - (i + 1) * layerHeight)
        .attr('height', layerHeight)
        .attr('stroke', '#555')
        .attr('stroke-width', 0.5);

      layersEnter
        .merge(layers)
        .transition()
        .duration(400)
        .attr('fill', (d) => colorScale(d));

      // --- GRIDLINES ---
      g.selectAll('.gridline').remove();

      const yTicks = yScale.ticks(10);
      yTicks.forEach((tick) => {
        g.append('line')
          .attr('class', 'gridline')
          .attr('x1', 0)
          .attr('x2', tankWidth)
          .attr('y1', yScale(tick))
          .attr('y2', yScale(tick))
          .attr('stroke', '#333')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '5,5')
          .attr('opacity', 0.4);
      });

      // --- Y AXIS (Left side - Height in meters) ---
      g.selectAll('.y-axis-left').remove();

      const yAxisLeft = d3
        .axisLeft(yScale)
        .ticks(10)
        .tickFormat((d) => (d as number).toFixed(2));

      g.append('g')
        .attr('class', 'y-axis-left')
        .call(yAxisLeft)
        .selectAll('text')
        .style('fill', '#e0e0e0')
        .style('font-size', '22px')
        .style('font-weight', '700');

      g.selectAll('.y-axis-left path')
        .style('stroke', '#e0e0e0')
        .style('stroke-width', 2);

      g.selectAll('.y-axis-left line')
        .style('stroke', '#e0e0e0')
        .style('stroke-width', 1.5);

      // Y axis label (left)
      g.selectAll('.y-axis-label').remove();
      g.append('text')
        .attr('class', 'y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -80)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e0e0e0')
        .attr('font-size', '26px')
        .attr('font-weight', '700')
        .text('Tank Height (m)');

      // --- COLOR SCALE LEGEND ---
      g.selectAll('.legend-group').remove();

      const legendWidth = 35;
      const legendHeight = height;
      const legendX = tankWidth + 60;

      const legendGroup = g.append('g').attr('class', 'legend-group');

      const legendScale = d3
        .scaleLinear()
        .domain([tempExtent[0], tempExtent[1]])
        .range([legendHeight, 0]);

      const legendAxis = d3
        .axisRight(legendScale)
        .ticks(10)
        .tickFormat((d) => (d as number).toFixed(2));

      // Create gradient for legend
      const defs = svg.selectAll<SVGDefsElement, null>('defs').data([null]);
      const defsEnter = defs.enter().append('defs');
      const defsGroup = defsEnter.merge(defs);

      defsGroup.selectAll('linearGradient').remove();

      const gradient = defsGroup
        .append('linearGradient')
        .attr('id', 'legend-gradient')
        .attr('x1', '0%')
        .attr('y1', '100%')
        .attr('x2', '0%')
        .attr('y2', '0%');

      const numStops = 50;
      for (let i = 0; i <= numStops; i++) {
        const t = i / numStops;
        const temp = tempExtent[0] + (tempExtent[1] - tempExtent[0]) * t;
        gradient
          .append('stop')
          .attr('offset', `${t * 100}%`)
          .attr('stop-color', colorScale(temp));
      }

      // Legend rectangle with border
      legendGroup
        .append('rect')
        .attr('x', legendX)
        .attr('y', 0)
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#legend-gradient)')
        .attr('stroke', '#e0e0e0')
        .attr('stroke-width', 2);

      // Legend axis
      legendGroup
        .append('g')
        .attr('transform', `translate(${legendX + legendWidth}, 0)`)
        .call(legendAxis)
        .selectAll('text')
        .style('fill', '#e0e0e0')
        .style('font-size', '22px')
        .style('font-weight', '700');

      legendGroup
        .selectAll('path')
        .style('stroke', '#e0e0e0')
        .style('stroke-width', 2);

      legendGroup
        .selectAll('line')
        .style('stroke', '#e0e0e0')
        .style('stroke-width', 1.5);

      // Legend label
      legendGroup
        .append('text')
        .attr('transform', `rotate(-90)`)
        .attr('x', -legendHeight / 2)
        .attr('y', legendX + legendWidth + 110)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e0e0e0')
        .attr('font-size', '26px')
        .attr('font-weight', '600')
        .text('Temperature (°C)');

      // --- TITLE ---
      g.selectAll('.title').remove();
      g.append('text')
        .attr('class', 'title')
        .attr('x', tankWidth / 2)
        .attr('y', -40)
        .attr('text-anchor', 'middle')
        .attr('font-size', '22px')
        .attr('font-weight', '700')
        .attr('fill', '#f0f0f0')
        .text(`Tank Temperatures (t = ${data[frameIndex].time.toFixed(2)} s)`);

      // Add tank border
      g.selectAll('.tank-border').remove();
      g.append('rect')
        .attr('class', 'tank-border')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', tankWidth)
        .attr('height', height)
        .attr('fill', 'none')
        .attr('stroke', '#e0e0e0')
        .attr('stroke-width', 2.5);
    };

    updateFrame(0);
  }

  private updateFrame(data: Frame[], frame: number): void {
    const svg = d3.select(this.svgRef.nativeElement);

    const allTemps = data.flatMap((d) => d.temps);
    const tempExtent = d3.extent(allTemps) as [number, number];

    const colorScale = d3
      .scaleSequential()
      .domain([tempExtent[1], tempExtent[0]])
      .interpolator(d3.interpolateRdYlBu);

    const temps = data[frame].temps;

    // Update layer colors
    svg
      .select('g')
      .selectAll<SVGRectElement, number>('rect.layer')
      .data(temps)
      .transition()
      .duration(400)
      .attr('fill', (d) => colorScale(d));

    // Update title
    svg
      .select('.title')
      .text(`Tank Temperatures (t = ${data[frame].time.toFixed(2)} s)`);
  }
}
