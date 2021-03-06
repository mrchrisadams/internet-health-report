/* global Waypoint */
import * as constants from '../constants';
import $ from 'jquery';
import * as d3 from 'd3';
import '../../plugins/noframework.waypoints';
window.$ = $;

class Bar {
  constructor(el, dataUrl) {
    this.el = el;
    this.dataUrl = dataUrl;
    this.margin = {top: 20, right: 20, bottom: 30, left: 40};
    this.classes = [`bar-stacked__svg`, `bar-stacked__data`, `bar-stacked__rect`, `x-axis`, `y-axis`];
    this.stack = d3.stack();
    this.svg = d3.select(this.el)
      .append(`svg`)
        .attr(`class`, this.classes[0]);
    this.svgData = this.svg.append(`g`)
      .attr(`transform`, `translate(${this.margin.left},${this.margin.top})`);
  }

  setSizes(transition = false) {
    this.width = $(this.el).width();
    this.height = constants.getWindowWidth() < constants.breakpointM ? 400 : Math.ceil(this.width * 0.52);
    this.innerWidth = this.width - this.margin.left - this.margin.right;
    this.innerHeight = this.height - this.margin.top - this.margin.bottom;

    this.x = d3.scaleBand()
      .rangeRound([0, this.innerWidth])
      .padding(0.1)
      .align(0.1);

    this.y = d3.scaleLinear()
      .rangeRound([this.innerHeight, 0]);

    this.z = d3.scaleOrdinal()
      .range(constants.colorRange);

    this.x.domain(this.data.map(d => d.Country));
    this.y.domain([0, d3.max(this.data, d => d.total)]).nice();
    this.z.domain(this.data.columns.slice(1));

    this.svg
      .attr(`width`, this.width)
      .attr(`height`, this.height);

    this.svgData.selectAll(`.${this.classes[1]}`)
      .attr(`fill`, d => this.z(d.key));

    this.svgData.selectAll(`.${this.classes[1]} rect`)
        .attr(`x`, d => this.x(d.data.Country))
        .attr(`y`, d => this.y(d[1]) + (this.y(d[0]) - this.y(d[1])))
        .attr(`width`, this.x.bandwidth());

    this.setAxes();

    if (transition) {
      this.animateChart();
    } else {
      this.svg.selectAll(`.${this.classes[1]} rect`)
        .attr(`y`, d => this.y(d[1]))
        .attr(`height`, d => this.y(d[0]) - this.y(d[1]));
    }
  }

  animateChart() {
    $(this.el).addClass(`is-active`);

    const dataColLength = this.data.length;
    const transitionDuration = 300;
    const dataTypesLength = this.data.columns.slice(1).length;

    this.svg.selectAll(`.${this.classes[1]} rect`)
      .transition()
      .duration(transitionDuration)
      .ease(d3.easePolyOut)
      .delay((d, i) => {
        let index;
        let delayDuration;

        for (index = dataTypesLength - 1; index >= 0; index--) {
          if (i >= dataColLength * index) {
            delayDuration = constants.chartFadeIn + (transitionDuration * index);
            break;
          }
        }

        return delayDuration;
      })
      .attr(`y`, d => this.y(d[1]))
      .attr(`height`, d => this.y(d[0]) - this.y(d[1]));
  }

  setAxes() {
    this.svg.select(`.${this.classes[3]}`)
      .attr(`transform`, `translate(0,${this.innerHeight})`)
      .call(d3.axisBottom(this.x));

    this.svg.select(`.${this.classes[4]}`)
      .call(d3.axisLeft(this.y));
  }

  render() {
    d3.csv(this.dataUrl, (error, data) => {
      if (error) {
        throw error;
      }

      this.data = data;
      this.data.forEach(this.type.bind(this));
      this.data.sort((a, b) => b.total - a.total);

      this.svgData.selectAll(`.${this.classes[1]}`)
        .data(this.stack.keys(this.data.columns.slice(1))(this.data))
        .enter().append(`g`)
          .attr(`class`, this.classes[1])
        .selectAll(`rect`)
        .data(d => d)
        .enter().append(`rect`);

      // // append x-axis
      this.svgData.append(`g`)
        .attr(`class`, this.classes[3]);

      // // append y-axis
      this.svgData.append(`g`)
        .attr(`class`, this.classes[4]);

      const waypoint = new Waypoint({
        element: document.getElementById(this.el.substr(1)),
        handler: () => {
          this.setSizes(true);
          waypoint.destroy();
        },
        offset: `50%`,
      });
    });

    $(window).on(`resize`, this.resize.bind(this));
  }

  resize() {
    this.setSizes();
  }

  type(d, i, columns) {
    let t;

    for (i = 1, t = 0; i < columns.columns.length; ++i) {
      t += d[columns.columns[i]] = +d[columns.columns[i]];
    }

    d.total = t;
    return d;
  }
}

const loadBarStackedCharts = () => {
  const $bar = $(`.js-bar-stacked`);

  $bar.each((index) => {
    const $this = $bar.eq(index);
    const id = $this.attr(`id`);
    const url = $this.data(`url`);

    new Bar(`#${id}`, url).render();
  });
};

export { loadBarStackedCharts };
