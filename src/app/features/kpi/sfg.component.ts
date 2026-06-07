import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  input,
} from '@angular/core';
import * as d3 from 'd3';

/** Port of KPIs/SFG.jsx (ThermalStorageSystem). */
@Component({
  selector: 'app-sfg',
  standalone: true,
  template: `
    <div
      [style.width]="width()"
      [style.height]="height()"
      style="background:#0a0a0f;display:flex;align-items:center;justify-content:center"
    >
      <svg #svg style="max-width:1200px;height:100%"></svg>
    </div>
  `,
})
export class SfgComponent implements AfterViewInit, OnDestroy {
  currentMode = input<string>('');
  height = input<string | number>('');
  width = input<string | number>('');

  @ViewChild('svg') svgRef!: ElementRef<SVGSVGElement>;

  // --- Flow sequences ---
  // F1 & F4 use this:
  private FLOW_SEQ_A = [
    0.106324001, 0.124205394, 0.12420895, 0.124211782, 0.124213905, 0.124216028,
    0.124217747, 0.124218901, 0.124220055, 0.12422121, 0.124222364, 0.124223179,
    0.124223702, 0.124224224, 0.124224746, 0.124225268, 0.12422579, 0.124226312,
    0.124226659, 0.124226964, 0.124227269, 0.124227574, 0.124227879,
    0.124228184, 0.12422849, 0.124228812, 0.124229133, 0.124229455, 0.124229776,
  ];

  // F2 & F3 use this:
  private FLOW_SEQ_B = [
    0.062089532, 0.062085839, 0.062083674, 0.062082021, 0.062080869,
    0.062079716, 0.062078857, 0.062078405, 0.062077954, 0.062077502, 0.06207705,
    0.062076849, 0.062076863, 0.062076877, 0.06207689, 0.062076904, 0.062076918,
    0.062076932, 0.062077083, 0.062077265, 0.062077448, 0.06207763, 0.062077813,
    0.062077995, 0.062078178, 0.062078357, 0.062078537,
  ];

  // --- Temperature sequences from your data ---
  private TEMP_SEQ_T1 = [
    71.3720221, 70.99051597, 70.94661424, 70.91272702, 70.88864263, 70.86455825,
    70.84606149, 70.83536671, 70.82467193, 70.81397716, 70.80328238,
    70.79727423, 70.79531623, 70.79335823, 70.79140023, 70.78944223,
    70.78748422, 70.78552622, 70.78599653, 70.78704032, 70.78808411, 70.7891279,
    70.79017169, 70.79121548, 70.79224041, 70.7930527, 70.79386499, 70.79467729,
    70.79548958, 70.79630187, 70.79711416, 70.79792646, 70.79873875,
    70.79955104, 70.8002749,
  ];

  private TEMP_SEQ_T2 = [
    70.20137248, 70.31627237, 70.38385993, 70.43675418, 70.47527049, 70.5137868,
    70.54391358, 70.56232609, 70.5807386, 70.59915112, 70.61756363, 70.62881142,
    70.63386751, 70.63892361, 70.6439797, 70.6490358, 70.6540919, 70.65914799,
    70.66029009, 70.66050785, 70.66072561, 70.66094336, 70.66116112,
    70.66137888, 70.66160385, 70.66191012, 70.66221639, 70.66252267,
    70.66282894, 70.66313522, 70.66344149, 70.66374777, 70.66405404,
    70.66436032, 70.66501706,
  ];

  private TEMP_SEQ_T3 = [
    68.94685008, 69.06037783, 69.12491251, 69.17539769, 69.21215064, 69.2489036,
    69.27764863, 69.29521225, 69.31277586, 69.33033947, 69.34790308,
    69.35862922, 69.36344647, 69.36826372, 69.37308097, 69.37789822,
    69.38271547, 69.38753273, 69.38861539, 69.38881608, 69.38901677,
    69.38921745, 69.38941814, 69.38961883, 69.38982644, 69.39011217, 69.3903979,
    69.39068362, 69.39096935, 69.39125507, 69.3915408, 69.39182653, 69.39211225,
    69.39239798, 69.39301774,
  ];

  private TEMP_SEQ_T4 = [
    70.20842878, 69.87390234, 69.82876586, 69.79391621, 69.76913395,
    69.74435168, 69.7253186, 69.71431307, 69.70330754, 69.69230201, 69.68129648,
    69.6751132, 69.67309728, 69.67108135, 69.66906543, 69.6670495, 69.66503358,
    69.66301765, 69.66350018, 69.66457275, 69.66564532, 69.66671789,
    69.66779046, 69.66886303, 69.66991619, 69.67075054, 69.67158488,
    69.67241922, 69.67325357, 69.67408791, 69.67492226, 69.6757566, 69.67659094,
    69.67742529, 69.67816933,
  ];

  private state = {
    temps: {
      T1: this.TEMP_SEQ_T1[0],
      T2: this.TEMP_SEQ_T2[0],
      T3: this.TEMP_SEQ_T3[0],
      T4: this.TEMP_SEQ_T4[0],
    },
    flows: {
      F1: this.FLOW_SEQ_A[0],
      F2: this.FLOW_SEQ_B[0],
      F3: this.FLOW_SEQ_B[0],
      F4: this.FLOW_SEQ_A[0],
    },
  };

  private sensorInterval: ReturnType<typeof setInterval> | null = null;
  private viewReady = false;

  private get isSimulation(): boolean {
    const cm = this.currentMode();
    return !!cm && cm.toLowerCase() === 'simulation';
  }

  constructor() {
    // Mirror the React effects that react to isSimulation changes.
    effect(() => {
      const sim = this.isSimulation;
      if (!this.viewReady) return;

      // --- Stop Transitions on Non-Simulation Mode ---
      if (!sim) {
        console.log('Mode is NOT Simulation. Interrupting D3 transitions.');
        d3.select(this.svgRef.nativeElement).selectAll('*').interrupt();
      }

      // SENSOR UPDATES: only when Simulation
      this.stopSensorUpdates();
      if (sim) {
        this.startSensorUpdates();
        // re-render to restart arrow transitions
        this.render();
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.render();
    if (!this.isSimulation) {
      d3.select(this.svgRef.nativeElement).selectAll('*').interrupt();
    } else {
      this.startSensorUpdates();
    }
  }

  ngOnDestroy(): void {
    this.stopSensorUpdates();
    if (this.svgRef) {
      d3.select(this.svgRef.nativeElement).selectAll('*').interrupt();
    }
  }

  private startSensorUpdates(): void {
    const idxRef = { current: 0 };
    const tickMs = 7000;
    this.sensorInterval = setInterval(() => {
      const i = idxRef.current;
      this.state = {
        temps: {
          T1: this.TEMP_SEQ_T1[i % this.TEMP_SEQ_T1.length],
          T2: this.TEMP_SEQ_T2[i % this.TEMP_SEQ_T2.length],
          T3: this.TEMP_SEQ_T3[i % this.TEMP_SEQ_T3.length],
          T4: this.TEMP_SEQ_T4[i % this.TEMP_SEQ_T4.length],
        },
        flows: {
          F1: this.FLOW_SEQ_A[i % this.FLOW_SEQ_A.length],
          F4: this.FLOW_SEQ_A[i % this.FLOW_SEQ_A.length],
          F2: this.FLOW_SEQ_B[i % this.FLOW_SEQ_B.length],
          F3: this.FLOW_SEQ_B[i % this.FLOW_SEQ_B.length],
        },
      };
      idxRef.current = i + 1;
      this.render();
    }, tickMs);
  }

  private stopSensorUpdates(): void {
    if (this.sensorInterval !== null) {
      clearInterval(this.sensorInterval);
      this.sensorInterval = null;
    }
  }

  private render(): void {
    const state = this.state;
    const width = 1300;
    const height = 560;

    const layout = {
      dcHeat: { x: 50, y: 255, width: 150, height: 80 },
      orcGen: { x: 1050, y: 255, width: 150, height: 80 },
      tank: { x: 490, y: 80, width: 270, height: 410 },
      leftVertical: 130,
      rightVertical: 1130,
      topHorizontal: 120,
      bottomHorizontal: 450,
    };

    const svg = d3.select(this.svgRef.nativeElement);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', '100%')
      .style('background', '#0a0a0f');

    const defs = svg.append('defs');

    // Tank gradient
    const tankGrad = defs
      .append('linearGradient')
      .attr('id', 'tankGrad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    tankGrad.append('stop').attr('offset', '0%').attr('stop-color', '#ff4d4d');
    tankGrad.append('stop').attr('offset', '40%').attr('stop-color', '#ff66aa');
    tankGrad.append('stop').attr('offset', '70%').attr('stop-color', '#9966ff');
    tankGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#4da6ff');

    // Hot pipe gradient
    const hotGrad = defs
      .append('linearGradient')
      .attr('id', 'hotGrad')
      .attr('x1', '0%')
      .attr('x2', '100%');
    hotGrad.append('stop').attr('offset', '0%').attr('stop-color', '#ff3333');
    hotGrad.append('stop').attr('offset', '50%').attr('stop-color', '#ff6633');
    hotGrad.append('stop').attr('offset', '100%').attr('stop-color', '#ff9933');

    // Cold pipe gradient
    const coldGrad = defs
      .append('linearGradient')
      .attr('id', 'coldGrad')
      .attr('x1', '0%')
      .attr('x2', '100%');
    coldGrad.append('stop').attr('offset', '0%').attr('stop-color', '#66ccff');
    coldGrad.append('stop').attr('offset', '50%').attr('stop-color', '#6699ff');
    coldGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#3366ff');

    const mainG = svg.append('g');

    // Define pipe paths clearly
    const pipes = [
      // LEFT SIDE HOT (DC Heat top -> up -> horizontal -> tank top)
      {
        path: `M ${layout.leftVertical},${layout.dcHeat.y}
               L ${layout.leftVertical},${layout.topHorizontal}
               L ${layout.tank.x},${layout.topHorizontal}`,
        type: 'hot',
      },

      // RIGHT SIDE HOT (ORC Gen top -> up -> horizontal -> tank top)
      {
        path: `M ${layout.rightVertical},${layout.orcGen.y}
               L ${layout.rightVertical},${layout.topHorizontal}
               L ${layout.tank.x + layout.tank.width},${layout.topHorizontal}`,
        type: 'hot',
      },

      // LEFT SIDE COLD (tank bottom -> horizontal -> down -> DC Heat bottom)
      {
        path: `M ${layout.tank.x},${layout.bottomHorizontal}
               L ${layout.leftVertical},${layout.bottomHorizontal}
               L ${layout.leftVertical},${
          layout.dcHeat.y + layout.dcHeat.height
        }`,
        type: 'cold',
      },

      // RIGHT SIDE COLD (tank bottom -> horizontal -> down -> ORC Gen bottom)
      {
        path: `M ${layout.tank.x + layout.tank.width},${layout.bottomHorizontal}
               L ${layout.rightVertical},${layout.bottomHorizontal}
               L ${layout.rightVertical},${
          layout.orcGen.y + layout.orcGen.height
        }`,
        type: 'cold',
      },
    ];

    // Draw pipes
    pipes.forEach((pipe, pipeIndex) => {
      const pathEl = mainG
        .append('path')
        .attr('d', pipe.path)
        .attr(
          'stroke',
          pipe.type === 'hot' ? 'url(#hotGrad)' : 'url(#coldGrad)'
        )
        .attr('stroke-width', 28)
        .attr('fill', 'none')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('opacity', 0.95);

      // Animate flow arrows
      const pathNode = pathEl.node() as SVGPathElement;
      const pathLength = pathNode.getTotalLength();

      const isRightSide = pipeIndex === 1 || pipeIndex === 3;
      for (let i = 0; i < 5; i++) {
        const arrow = mainG
          .append('path')
          .attr('d', 'M -8,-4 L 0,0 L -8,4 L -5,0 Z')
          .attr('fill', pipe.type === 'hot' ? '#000' : '#000')
          .attr('opacity', 0.95);

        const animateArrow = (): void => {
          arrow
            .transition()
            .duration(4000)
            .ease(d3.easeLinear)
            .attrTween('transform', () => {
              return (t: number) => {
                let offset: number;
                if (isRightSide) {
                  // Reverse direction for right side
                  offset = (1 - ((t + i * 0.2) % 1)) * pathLength;
                } else {
                  // Normal direction for left side
                  offset = ((t + i * 0.2) % 1) * pathLength;
                }
                const point = pathNode.getPointAtLength(offset);
                const nextOffset = isRightSide
                  ? Math.max(offset - 1, 0)
                  : Math.min(offset + 1, pathLength);
                const nextPoint = pathNode.getPointAtLength(nextOffset);
                const angle =
                  (Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) *
                    180) /
                  Math.PI;
                return `translate(${point.x},${point.y}) rotate(${angle})`;
              };
            })
            .on('end', animateArrow);
        };
        animateArrow();
      }
    });

    // Tank
    mainG
      .append('rect')
      .attr('x', layout.tank.x)
      .attr('y', layout.tank.y)
      .attr('width', layout.tank.width)
      .attr('height', layout.tank.height)
      .attr('rx', 20)
      .attr('fill', 'url(#tankGrad)')
      .attr('stroke', '#999')
      .attr('stroke-width', 4);

    mainG
      .append('text')
      .attr('x', layout.tank.x + layout.tank.width / 2)
      .attr('y', layout.tank.y - 20)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', 24)
      .attr('font-weight', 'bold')
      .text('THERMAL STORAGE TANK');

    // Valves
    const valves = [
      { x: layout.leftVertical, y: layout.topHorizontal },
      { x: layout.tank.x, y: layout.topHorizontal },
      { x: layout.leftVertical, y: layout.bottomHorizontal },
      { x: layout.tank.x, y: layout.bottomHorizontal },
      { x: layout.rightVertical, y: layout.topHorizontal },
      { x: layout.tank.x + layout.tank.width, y: layout.topHorizontal },
      { x: layout.rightVertical, y: layout.bottomHorizontal },
      { x: layout.tank.x + layout.tank.width, y: layout.bottomHorizontal },
    ];

    valves.forEach((v) => {
      const s = 12;
      mainG
        .append('path')
        .attr(
          'd',
          `M ${v.x - s},${v.y - s} L ${v.x + s},${v.y + s} M ${v.x + s},${
            v.y - s
          } L ${v.x - s},${v.y + s}`
        )
        .attr('fill', 'none');
    });

    // DC Heat box
    mainG
      .append('rect')
      .attr('x', layout.dcHeat.x)
      .attr('y', layout.dcHeat.y)
      .attr('width', layout.dcHeat.width)
      .attr('height', layout.dcHeat.height)
      .attr('rx', 12)
      .attr('fill', '#ff8833')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3);

    mainG
      .append('text')
      .attr('x', layout.dcHeat.x + layout.dcHeat.width / 2)
      .attr('y', layout.dcHeat.y + layout.dcHeat.height / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'white')
      .attr('font-size', 18)
      .attr('font-weight', 'bold')
      .text('DC Heat');

    // ORC Gen box
    mainG
      .append('rect')
      .attr('x', layout.orcGen.x)
      .attr('y', layout.orcGen.y)
      .attr('width', layout.orcGen.width)
      .attr('height', layout.orcGen.height)
      .attr('rx', 12)
      .attr('fill', '#33cc66')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3);

    mainG
      .append('text')
      .attr('x', layout.orcGen.x + layout.orcGen.width / 2)
      .attr('y', layout.orcGen.y + layout.orcGen.height / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'white')
      .attr('font-size', 18)
      .attr('font-weight', 'bold')
      .text('ORC Gen');

    // Labels
    mainG
      .append('text')
      .attr('x', 225)
      .attr('y', 285)
      .attr('fill', 'white')
      .attr('font-size', 22)
      .attr('font-weight', 'bold')
      .text('Charge');

    mainG
      .append('text')
      .attr('x', 235)
      .attr('y', 310)
      .attr('fill', 'white')
      .attr('font-size', 22)
      .attr('font-weight', 'bold')
      .text('Cycle');

    mainG
      .append('text')
      .attr('x', 925)
      .attr('y', 285)
      .attr('fill', 'white')
      .attr('font-size', 22)
      .attr('font-weight', 'bold')
      .text('Discharge');

    mainG
      .append('text')
      .attr('x', 945)
      .attr('y', 310)
      .attr('fill', 'white')
      .attr('font-size', 22)
      .attr('font-weight', 'bold')
      .text('Cycle');

    // Sensors
    const drawSensor = (
      x: number,
      y: number,
      label: string,
      value: string,
      unit: string
    ): void => {
      const g = mainG.append('g');
      g.append('rect')
        .attr('x', x - 50)
        .attr('y', y - 16)
        .attr('width', 110)
        .attr('height', 32)
        .attr('rx', 8)
        .attr('fill', '#2a2a2a')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      g.append('text')
        .attr('x', x + 5)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', 'white')
        .attr('font-size', 15)
        .attr('font-weight', 'bold')
        .text(`${label} - ${value}${unit}`);
    };

    const drawFlow = (
      x: number,
      y: number,
      label: string,
      value: string
    ): void => {
      const g = mainG.append('g');
      g.append('rect')
        .attr('x', x - 70)
        .attr('y', y - 18)
        .attr('width', 140)
        .attr('height', 36)
        .attr('rx', 8)
        .attr('fill', '#111')
        .attr('stroke', '#ffd600')
        .attr('stroke-width', 3);

      g.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#ffd600')
        .attr('font-size', 14)
        .attr('font-weight', 'bold')
        .text(`${label} - ${value} kg/s`);
    };

    // Temperature sensors on vertical pipes
    drawSensor(
      layout.leftVertical - 80,
      (layout.dcHeat.y + layout.topHorizontal) / 2,
      'T1',
      state.temps.T1.toFixed(2),
      '°C'
    );
    drawSensor(
      layout.rightVertical + 70,
      (layout.orcGen.y + layout.topHorizontal) / 2,
      'T2',
      state.temps.T2.toFixed(2),
      '°C'
    );
    drawSensor(
      layout.rightVertical + 70,
      (layout.bottomHorizontal + layout.orcGen.y + layout.orcGen.height) / 2,
      'T3',
      state.temps.T3.toFixed(2),
      '°C'
    );
    drawSensor(
      layout.leftVertical - 80,
      (layout.bottomHorizontal + layout.dcHeat.y + layout.dcHeat.height) / 2,
      'T4',
      state.temps.T4.toFixed(2),
      '°C'
    );

    // Flow sensors on horizontal pipes
    drawFlow(
      (layout.leftVertical + layout.tank.x) / 2,
      layout.topHorizontal - 40,
      'F1',
      state.flows.F1.toFixed(2)
    );
    drawFlow(
      (layout.rightVertical + layout.tank.x + layout.tank.width) / 2,
      layout.topHorizontal - 40,
      'F2',
      state.flows.F2.toFixed(2)
    );
    drawFlow(
      (layout.rightVertical + layout.tank.x + layout.tank.width) / 2,
      layout.bottomHorizontal + 40,
      'F3',
      state.flows.F3.toFixed(2)
    );
    drawFlow(
      (layout.leftVertical + layout.tank.x) / 2,
      layout.bottomHorizontal + 40,
      'F4',
      state.flows.F4.toFixed(2)
    );
  }
}
