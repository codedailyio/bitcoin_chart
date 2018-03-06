import React, { Component } from "react";
import { Line, Bar, LinePath } from "@vx/shape";
import { curveLinear } from "@vx/curve";
import { scaleTime, scaleLinear } from "@vx/scale";
import { withTooltip, Tooltip } from "@vx/tooltip";
import { localPoint } from "@vx/event";
import { extent, max, bisector } from "d3-array";
import { timeFormat } from "d3-time-format";

const formatDate = timeFormat("%b %d, '%y");
const width = window.innerWidth;
const height = window.innerHeight;

const xSelector = d => new Date(d.date);
const ySelector = d => d.price;
const bisectDate = bisector(d => new Date(d.date)).left;

class App extends Component {
  state = {
    data: null,
  };
  async componentDidMount() {
    const res = await fetch("https://api.coindesk.com/v1/bpi/historical/close.json");
    const data = await res.json();

    this.setState({
      data: Object.keys(data.bpi).map(date => {
        return {
          date,
          price: data.bpi[date],
        };
      }),
    });
  }

  handleTooltip = ({ event, data, xSelector, xScale, yScale }) => {
    const { showTooltip } = this.props;
    const { x } = localPoint(event);
    const x0 = xScale.invert(x);
    const index = bisectDate(data, x0, 1);
    const d0 = data[index - 1];
    const d1 = data[index];
    let d = d0;
    if (d1 && d1.date) {
      d = x0 - xSelector(d0) > xSelector(d1) - x0 ? d1 : d0;
    }
    showTooltip({
      tooltipData: d,
      tooltipLeft: xScale(xSelector(d)),
      tooltipTop: yScale(ySelector(d)),
    });
  };
  render() {
    const { data } = this.state;
    const { showTooltip, hideTooltip, tooltipData, tooltipTop, tooltipLeft, events } = this.props;

    if (!data) return null;

    const padding = 100;
    const xMax = width - padding;
    const yMax = height - padding;
    // scales
    const xScale = scaleTime({
      range: [padding, xMax],
      domain: extent(data, xSelector),
    });
    const yScale = scaleLinear({
      range: [yMax, padding],
      domain: [0, max(data, ySelector) + yMax / 3],
      nice: true,
    });

    return (
      <div>
        <svg width={width} height={height}>
          <rect x={0} y={0} width={width} height={height} fill="#32deaa" />
          <LinePath
            data={data}
            xScale={xScale}
            yScale={yScale}
            x={xSelector}
            y={ySelector}
            strokeWidth={5}
            stroke="#FFF"
            strokeLinecap="round"
            fill="transparent"
            curve={curveLinear}
          />
          <Bar
            x={0}
            y={0}
            width={width}
            height={height}
            fill="transparent"
            rx={14}
            data={data}
            onTouchStart={data => event =>
              this.handleTooltip({
                event,
                data,
                xSelector,
                xScale,
                yScale,
              })}
            onTouchMove={data => event =>
              this.handleTooltip({
                event,
                data,
                xSelector,
                xScale,
                yScale,
              })}
            onMouseMove={data => event =>
              this.handleTooltip({
                event,
                data,
                xSelector,
                xScale,
                yScale,
              })}
            onMouseLeave={data => event => hideTooltip()}
          />
          {tooltipData && (
            <g>
              <Line
                from={{ x: tooltipLeft, y: 0 }}
                to={{ x: tooltipLeft, y: yMax }}
                stroke="#5C77EB"
                strokeWidth={4}
                style={{ pointerEvents: "none" }}
                strokeDasharray="4,6"
              />
              <circle
                cx={tooltipLeft}
                cy={tooltipTop}
                r={4}
                fill="#5C77EB"
                stroke="white"
                strokeWidth={2}
                style={{ pointerEvents: "none" }}
              />
            </g>
          )}
        </svg>
        {tooltipData && (
          <div>
            <Tooltip
              top={tooltipTop - 12}
              left={tooltipLeft + 12}
              style={{
                backgroundColor: "#5C77EB",
                color: "#FFF",
              }}
            >
              {`$${ySelector(tooltipData)}`}
            </Tooltip>
            <Tooltip
              top={yMax - 30}
              left={tooltipLeft}
              style={{
                transform: "translateX(-50%)",
              }}
            >
              {formatDate(xSelector(tooltipData))}
            </Tooltip>
          </div>
        )}
      </div>
    );
  }
}

export default withTooltip(App);
