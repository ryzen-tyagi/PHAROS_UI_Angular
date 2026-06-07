import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';

/** Port of SystemFlowModel/SystemFlowD3Model.jsx (ThermalSystemDiagram). */
@Component({
  selector: 'app-system-flow-d3-model',
  standalone: true,
  template: `
    <div
      class="w-full min-h-screen bg-gray-100 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-lg shadow-xl p-4">
        <h2 class="text-2xl font-bold text-center mb-4 text-gray-800">
          Thermal Energy Storage System
        </h2>
        <svg #svg></svg>
      </div>
    </div>
  `,
})
export class SystemFlowD3ModelComponent implements AfterViewInit, OnDestroy {
  @ViewChild('svg') svgRef!: ElementRef<SVGSVGElement>;

  ngAfterViewInit(): void {
    const width = 1000;
    const height = 600;

    // Clear any existing SVG content
    d3.select(this.svgRef.nativeElement).selectAll('*').remove();

    const svg = d3
      .select(this.svgRef.nativeElement)
      .attr('width', width)
      .attr('height', height)
      .style('background', 'white');

    // Define arrow markers
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', '#666');

    // Define gradient for tank
    const gradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'tankGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('style', 'stop-color:#ff4444;stop-opacity:1');

    gradient
      .append('stop')
      .attr('offset', '50%')
      .attr('style', 'stop-color:#ff1493;stop-opacity:1');

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('style', 'stop-color:#4169e1;stop-opacity:1');

    // Define pipe gradient for 3D effect
    const pipeGradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'pipeGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    pipeGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('style', 'stop-color:#999;stop-opacity:1');

    pipeGradient
      .append('stop')
      .attr('offset', '50%')
      .attr('style', 'stop-color:#ddd;stop-opacity:1');

    pipeGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('style', 'stop-color:#666;stop-opacity:1');

    const container = svg.append('g').attr('transform', 'translate(50, 50)');

    // Function to draw pipe segments
    function drawPipe(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      isVertical = false
    ): void {
      const pipeWidth = 16;

      if (isVertical) {
        // Vertical pipe
        container
          .append('rect')
          .attr('x', x1 - pipeWidth / 2)
          .attr('y', Math.min(y1, y2))
          .attr('width', pipeWidth)
          .attr('height', Math.abs(y2 - y1))
          .attr('fill', 'url(#pipeGradient)')
          .attr('stroke', '#444')
          .attr('stroke-width', 1);

        // Inner shadow
        container
          .append('rect')
          .attr('x', x1 - pipeWidth / 2 + 2)
          .attr('y', Math.min(y1, y2))
          .attr('width', 4)
          .attr('height', Math.abs(y2 - y1))
          .attr('fill', '#333')
          .attr('opacity', 0.3);
      } else {
        // Horizontal pipe
        container
          .append('rect')
          .attr('x', Math.min(x1, x2))
          .attr('y', y1 - pipeWidth / 2)
          .attr('width', Math.abs(x2 - x1))
          .attr('height', pipeWidth)
          .attr('fill', 'url(#pipeGradient)')
          .attr('stroke', '#444')
          .attr('stroke-width', 1);

        // Inner shadow
        container
          .append('rect')
          .attr('x', Math.min(x1, x2))
          .attr('y', y1 - pipeWidth / 2 + 2)
          .attr('width', Math.abs(x2 - x1))
          .attr('height', 4)
          .attr('fill', '#333')
          .attr('opacity', 0.3);
      }

      // Direction arrow
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      container
        .append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', 'transparent')
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#arrowhead)');

      container
        .append('path')
        .attr(
          'd',
          isVertical
            ? `M ${midX - 4} ${midY - 6} L ${midX} ${midY} L ${midX + 4} ${
                midY - 6
              }`
            : `M ${midX - 6} ${midY - 4} L ${midX} ${midY} L ${midX - 6} ${
                midY + 4
              }`
        )
        .attr('fill', 'none')
        .attr('stroke', '#ff4444')
        .attr('stroke-width', 2);
    }

    // Draw all pipes
    drawPipe(250, 120, 350, 120, false); // Top left horizontal
    drawPipe(550, 120, 650, 120, false); // Top right horizontal
    drawPipe(650, 380, 550, 380, false); // Bottom right horizontal
    drawPipe(350, 380, 250, 380, false); // Bottom left horizontal
    drawPipe(130, 230, 130, 300, true); // Left vertical
    drawPipe(770, 300, 770, 240, true); // Right vertical
    drawPipe(330, 100, 330, 150, true); // Top left valve connection
    drawPipe(570, 100, 570, 150, true); // Top right valve connection
    drawPipe(450, 380, 450, 420, true); // Bottom valve connection
    drawPipe(450, 70, 450, 100, true); // Top center connection

    // Draw charge cycle chamber
    container
      .append('rect')
      .attr('x', 50)
      .attr('y', 150)
      .attr('width', 200)
      .attr('height', 200)
      .attr('fill', 'rgba(65, 105, 225, 0.1)')
      .attr('stroke', '#4169e1')
      .attr('stroke-width', 3);

    container
      .append('text')
      .attr('x', 150)
      .attr('y', 250)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('fill', '#333')
      .text('Charge');

    container
      .append('text')
      .attr('x', 150)
      .attr('y', 270)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('fill', '#333')
      .text('cycle');

    // DC Heat box
    container
      .append('rect')
      .attr('x', 90)
      .attr('y', 180)
      .attr('width', 80)
      .attr('height', 50)
      .attr('fill', '#ff9933')
      .attr('stroke', '#cc6600')
      .attr('stroke-width', 2)
      .attr('rx', 5);

    container
      .append('text')
      .attr('x', 130)
      .attr('y', 210)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-weight', 'bold')
      .text('DC Heat');

    // Draw discharge cycle chamber
    container
      .append('rect')
      .attr('x', 650)
      .attr('y', 150)
      .attr('width', 200)
      .attr('height', 200)
      .attr('fill', 'rgba(65, 105, 225, 0.1)')
      .attr('stroke', '#4169e1')
      .attr('stroke-width', 3);

    container
      .append('text')
      .attr('x', 750)
      .attr('y', 250)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('fill', '#333')
      .text('Discharge');

    container
      .append('text')
      .attr('x', 750)
      .attr('y', 270)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('fill', '#333')
      .text('cycle');

    // ORC Generator box
    container
      .append('rect')
      .attr('x', 710)
      .attr('y', 180)
      .attr('width', 90)
      .attr('height', 60)
      .attr('fill', '#4169e1')
      .attr('stroke', '#1e3a8a')
      .attr('stroke-width', 2)
      .attr('rx', 5);

    container
      .append('text')
      .attr('x', 755)
      .attr('y', 205)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-weight', 'bold')
      .text('ORC');

    container
      .append('text')
      .attr('x', 755)
      .attr('y', 225)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-weight', 'bold')
      .text('Generator');

    // Draw Tank
    container
      .append('ellipse')
      .attr('cx', 450)
      .attr('cy', 150)
      .attr('rx', 100)
      .attr('ry', 30)
      .attr('fill', 'url(#tankGradient)')
      .attr('stroke', '#333')
      .attr('stroke-width', 2);

    container
      .append('rect')
      .attr('x', 350)
      .attr('y', 150)
      .attr('width', 200)
      .attr('height', 200)
      .attr('fill', 'url(#tankGradient)')
      .attr('stroke', '#333')
      .attr('stroke-width', 2);

    container
      .append('ellipse')
      .attr('cx', 450)
      .attr('cy', 350)
      .attr('rx', 100)
      .attr('ry', 30)
      .attr('fill', 'url(#tankGradient)')
      .attr('stroke', '#333')
      .attr('stroke-width', 2);

    container
      .append('text')
      .attr('x', 450)
      .attr('y', 255)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-size', '36px')
      .style('font-weight', 'bold')
      .text('Tank');

    // 3-way valve boxes
    container
      .append('rect')
      .attr('x', 180)
      .attr('y', 10)
      .attr('width', 140)
      .attr('height', 60)
      .attr('fill', 'white')
      .attr('stroke', '#333')
      .attr('stroke-width', 2)
      .attr('rx', 3);

    container
      .append('text')
      .attr('x', 250)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#666')
      .text('3 way valve that controls the');

    container
      .append('text')
      .attr('x', 250)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#666')
      .text('flow into the tank');

    container
      .append('rect')
      .attr('x', 360)
      .attr('y', 420)
      .attr('width', 140)
      .attr('height', 60)
      .attr('fill', 'white')
      .attr('stroke', '#333')
      .attr('stroke-width', 2)
      .attr('rx', 3);

    container
      .append('text')
      .attr('x', 430)
      .attr('y', 440)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#666')
      .text('3 way valve that controls the');

    container
      .append('text')
      .attr('x', 430)
      .attr('y', 460)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#666')
      .text('flow into the tank');

    // Measurement labels
    const measurements = [
      { text: ['Charge Cycle', 'High Temp', 'Measurement'], x: 10, y: 100 },
      { text: ['Charge Cycle', 'Low Temp', 'Measurement'], x: 10, y: 280 },
      { text: ['Discharge Cycle', 'High Temp', 'Measurement'], x: 860, y: 100 },
      { text: ['Discharge Cycle', 'Low Temp', 'Measurement'], x: 860, y: 280 },
      {
        text: ['Tank High Temp', 'Input/Output', 'Measurement'],
        x: 380,
        y: 10,
      },
      {
        text: ['Tank High Temp', 'Input/Output', 'Measurement'],
        x: 330,
        y: 420,
      },
    ];

    measurements.forEach((m) => {
      m.text.forEach((line, i) => {
        container
          .append('text')
          .attr('x', m.x)
          .attr('y', m.y + i * 14)
          .style('font-size', '11px')
          .style('fill', '#666')
          .text(line);
      });
    });

    // Add valve symbols
    const valvePositions = [
      { x: 330, y: 100 },
      { x: 570, y: 100 },
      { x: 330, y: 380 },
      { x: 570, y: 380 },
    ];

    valvePositions.forEach((pos) => {
      container
        .append('circle')
        .attr('cx', pos.x)
        .attr('cy', pos.y)
        .attr('r', 10)
        .attr('fill', '#ffcc00')
        .attr('stroke', '#333')
        .attr('stroke-width', 2);

      container
        .append('line')
        .attr('x1', pos.x - 6)
        .attr('y1', pos.y - 6)
        .attr('x2', pos.x + 6)
        .attr('y2', pos.y + 6)
        .attr('stroke', '#333')
        .attr('stroke-width', 2);

      container
        .append('line')
        .attr('x1', pos.x - 6)
        .attr('y1', pos.y + 6)
        .attr('x2', pos.x + 6)
        .attr('y2', pos.y - 6)
        .attr('stroke', '#333')
        .attr('stroke-width', 2);
    });

    // Animate fluid particles inside pipes
    const animateFluidParticle = (
      path: [number, number][],
      duration: number,
      delay: number
    ): void => {
      const [start, end] = path;

      const particle = container
        .append('circle')
        .attr('r', 5)
        .attr('cx', start[0])
        .attr('cy', start[1])
        .attr('fill', '#ff4444')
        .attr('opacity', 0.9)
        .style('filter', 'blur(1px)');

      function animate(): void {
        particle
          .attr('cx', start[0])
          .attr('cy', start[1])
          .transition()
          .delay(delay)
          .duration(duration)
          .ease(d3.easeLinear)
          .attr('cx', end[0])
          .attr('cy', end[1])
          .on('end', animate);
      }

      animate();
    };

    // Create multiple particles on each path for continuous flow effect
    const flowPaths: { path: [number, number][]; duration: number }[] = [
      {
        path: [
          [250, 120],
          [350, 120],
        ],
        duration: 2000,
      },
      {
        path: [
          [550, 120],
          [650, 120],
        ],
        duration: 2000,
      },
      {
        path: [
          [650, 380],
          [550, 380],
        ],
        duration: 2000,
      },
      {
        path: [
          [350, 380],
          [250, 380],
        ],
        duration: 2000,
      },
      {
        path: [
          [130, 230],
          [130, 300],
        ],
        duration: 1500,
      },
      {
        path: [
          [770, 300],
          [770, 240],
        ],
        duration: 1500,
      },
      {
        path: [
          [330, 100],
          [330, 150],
        ],
        duration: 1000,
      },
      {
        path: [
          [570, 100],
          [570, 150],
        ],
        duration: 1000,
      },
      {
        path: [
          [450, 380],
          [450, 420],
        ],
        duration: 1000,
      },
      {
        path: [
          [450, 70],
          [450, 100],
        ],
        duration: 800,
      },
    ];

    // Create multiple particles per path for dense flow
    flowPaths.forEach((pathData, pathIndex) => {
      for (let i = 0; i < 3; i++) {
        animateFluidParticle(
          pathData.path,
          pathData.duration,
          pathIndex * 100 + i * (pathData.duration / 3)
        );
      }
    });
  }

  ngOnDestroy(): void {
    if (this.svgRef) {
      d3.select(this.svgRef.nativeElement).selectAll('*').interrupt();
    }
  }
}
