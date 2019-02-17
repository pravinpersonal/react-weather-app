import * as d3 from 'd3';

export interface Config {
  [ key: string ]: any;
}

export default class Gauge {
  config: Config = {
    size: 200,
    clipWidth: 200,
    clipHeight: 110,
    ringInset: 20,
    ringWidth: 20,
    
    pointerWidth: 10,
    pointerTailLength: 5,
    pointerHeadLengthPercent: 0.9,
    
    minValue: 0,
    maxValue: 10,
    
    minAngle: -90,
    maxAngle: 90,
    
    transitionMs: 750,
    
    majorTicks: 5,
    labelFormat: d3.format('d'),
    labelInset: 10,
    
    arcColorFn: d3.interpolateHsl(d3.rgb('#e8e2ca'), d3.rgb('#3e6c0a'))
  };
  
  container: any = null;
  configuration: any = null;
  range: any;
  r: any;
  pointerHeadLength: any;
  svg: any;
  arc: any;
  scale: any;
  ticks: any;
  tickData: any;
  pointer: any;
  
  constructor(container: any, configuration: any) {
    this.container = container;
    this.configuration = configuration;
    this.configure(this.configuration);
  }
  
  deg2rad(deg: number) {
    return deg * Math.PI / 180;
  }
  
  configure(configuration: any) {
    for (const prop in configuration) {
      if (configuration.hasOwnProperty(prop)) {
        this.config.prop = configuration.prop;
      }
    }
    
    this.range = this.config.maxAngle - this.config.minAngle;
    this.r = this.config.size / 2;
    this.pointerHeadLength = Math.round(this.r * this.config.pointerHeadLengthPercent);
    
    // a linear scale that maps domain values to a percent from 0..1
    this.scale = d3.scaleLinear()
      .range([ 0, 1 ])
      .domain([ this.config.minValue, this.config.maxValue ]);
    
    this.ticks = this.scale.ticks(this.config.majorTicks);
    this.tickData = d3.range(this.config.majorTicks).map(() => {
      return 1 / this.config.majorTicks;
    });
    
    this.arc = d3.arc()
      .innerRadius(this.r - this.config.ringWidth - this.config.ringInset)
      .outerRadius(this.r - this.config.ringInset)
      .startAngle((d: any, i: number) => {
        const ratio = d * i;
        return this.deg2rad(this.config.minAngle + (ratio * this.range));
      })
      .endAngle((d: any, i: number) => {
        const ratio = d * (i + 1);
        return this.deg2rad(this.config.minAngle + (ratio * this.range));
      });
  }
  
  centerTranslation() {
    return 'translate(' + this.r + ',' + this.r + ')';
  }
  
  render(newValue: any) {
    this.svg = d3.select(this.container)
      .append('svg:svg')
      .attr('class', 'gauge')
      .attr('width', this.config.clipWidth)
      .attr('height', this.config.clipHeight)
      .attr('x', this.config.x)
      .attr('y', this.config.y);
    
    this.svg.append('text')
      .text(this.config.title)
      .attr('dx', this.config.titleDx)
      .attr('dy', this.config.titleDy)
      .attr('class', this.config.class);
    
    const centerTx = this.centerTranslation();
    
    const arcs = this.svg.append('g')
      .attr('class', 'arc')
      .attr('transform', centerTx);
    
    arcs.selectAll('path')
      .data(this.tickData)
      .enter().append('path')
      .attr('fill', (d: any, i: number) => {
        return this.config.arcColorFn(d * i);
      })
      .attr('d', this.arc);
    
    const lg = this.svg.append('g')
      .attr('class', 'label')
      .attr('transform', centerTx);
    lg.selectAll('text')
      .data(this.ticks)
      .enter().append('text')
      .attr('transform', (d: any) => {
        const ratio = this.scale(d);
        const newAngle = this.config.minAngle + (ratio * this.range);
        return 'rotate(' + newAngle + ') translate(0,' + (this.config.labelInset - this.r) + ')';
      })
      .text(this.config.labelFormat);
    
    const lineData = [ [ this.config.pointerWidth / 2, 0 ],
      [ 0, -this.pointerHeadLength ],
      [ -(this.config.pointerWidth / 2), 0 ],
      [ 0, this.config.pointerTailLength ],
      [ this.config.pointerWidth / 2, 0 ] ];
    const pointerLine = d3.line().curve(d3.curveLinear);
    const pg = this.svg.append('g').data([ lineData ])
      .attr('class', 'pointer')
      .attr('transform', centerTx);
    
    this.pointer = pg.append('path')
      .attr('d', pointerLine)
      .attr('transform', 'rotate(' + this.config.minAngle + ')');
    
    this.update(newValue === undefined ? 0 : newValue, undefined);
  }
  
  update(newValue: any, newConfiguration: any) {
    if (newConfiguration !== undefined) {
      this.configure(newConfiguration);
    }
    const ratio = this.scale(newValue);
    const newAngle = this.config.minAngle + (ratio * this.range);
    this.pointer.transition()
      .duration(this.config.transitionMs)
      .ease(d3.easeElastic)
      .attr('transform', 'rotate(' + newAngle + ')');
  }
}
