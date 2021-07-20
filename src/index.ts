import fetch from "node-fetch";
import SimpleLinearRegression from "ml-regression-simple-linear";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import type { ChartConfiguration, ScatterDataPoint } from "chart.js";

const DATA_ENDPOINT = "https://some-url";

const transformApiResponse = (
  data: { x: number; y: number }[],
): [number[], number[]] => {
  return [data.map(({ x }) => x), data.map(({ y }) => y)];
};

const renderChart = async (
  data: ScatterDataPoint[],
  regression: SimpleLinearRegression,
) => {
  const config: ChartConfiguration = {
    type: "scatter",
    data: {
      datasets: [
        { type: 'scatter', label: "Dataset", data, borderColor: 'black', pointBackgroundColor: 'black' },
        {
          type: "line",
          label: "Regression",
          borderColor: "grey",
          fill: false,
          showLine: true,
          data: data.map(({ x, y }) => ({ x, y: regression.predict(x) })),
          cubicInterpolationMode: "monotone",
          pointRadius: 0,
        },
      ],
    },
    options: {
      scales: {
        x: {
          type: "linear",
          title: { display: true, text: 'x-axis' },
          position: "bottom",
        },
        y: {
          type: "linear",
          title: { display: true, text: 'y-axis' },
          position: "left",
        },
      },
    },
  };

  const chartJS = new ChartJSNodeCanvas({ width: 500, height: 500 });
  return chartJS.renderToDataURL(config, "image/png");
};

const main = async () => {
  const response = await fetch(DATA_ENDPOINT);
  const data = await response.json();

  const [xValues, yValues] = transformApiResponse(data);

  const regression = new SimpleLinearRegression(xValues, yValues);

  const render = await renderChart(data, regression);

  return [regression, render] as const;
};

export { main };
