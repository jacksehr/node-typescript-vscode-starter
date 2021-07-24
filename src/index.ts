// import fetch from "node-fetch";
import SimpleLinearRegression from "ml-regression-simple-linear";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import type { ChartConfiguration, ScatterDataPoint } from "chart.js";

import fs from "fs";
import path from "path";
import CsvReadableStream from "csv-reader";

type DataPoint = string | number | boolean; // boolean for compatability with CSV library - it doesn't export its types

type DataRow =
  | DataPoint
  | {
      [header: string]: DataPoint;
    };

const CULTURE_NUMBER = "Culture Number";
type DICRow = { [CULTURE_NUMBER]: number; Count: number };

// const DATA_ENDPOINT = "https://some-url";

const normaliseDataSet = (
  data: { x: number; y: number }[]
): [number[], number[]] => {
  return [data.map(({ x }) => x), data.map(({ y }) => y)];
};

const renderChart = async (
  data: ScatterDataPoint[],
  regression: SimpleLinearRegression,
  chartTitle: string,
  [xAxis, yAxis]: [string, string]
) => {
  const config: ChartConfiguration = {
    type: "scatter",
    data: {
      datasets: [
        {
          type: "scatter",
          label: "Dataset",
          data,
          borderColor: "black",
          pointBackgroundColor: "black",
        },
        {
          type: "line",
          label: "Regression",
          borderColor: "grey",
          fill: false,
          showLine: true,
          data: data.map(({ x }) => ({ x, y: regression.predict(x) })),
          pointRadius: 0,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          display: false
        },
        title: {
          text: chartTitle,
          display: true
        }
      },
      scales: {
        x: {
          type: "linear",
          title: { display: true, text: xAxis },
          position: "bottom",
        },
        y: {
          type: "linear",
          title: { display: true, text: yAxis },
          position: "left",
        },
      },
    },
  };

  const chartJS = new ChartJSNodeCanvas({ width: 500, height: 500 });
  return chartJS.renderToBuffer(config, "image/png");
};

const transformDICData = (dicData: DataRow[]) => {
  let currentCultureNumber = 1,
    runningCount = 0,
    replicatesSeen = 0;

  return dicData.reduce((outputData, row, index, arr) => {
    const { [CULTURE_NUMBER]: cultureNumber, Count: count } = row as DICRow;

    if (cultureNumber !== currentCultureNumber || index === arr.length - 1) {
      outputData.push({
        [CULTURE_NUMBER]: currentCultureNumber,
        Count: runningCount / replicatesSeen,
      });
      currentCultureNumber++;
      runningCount = 0;
      replicatesSeen = 0;
    }

    runningCount += count;
    replicatesSeen++;

    return outputData;
  }, [] as DICRow[]);
};

const readCSVToObject = async (csvFilepath: string): Promise<DataRow[]> => {
  const output: DataRow[] = [];

  const inputStream = fs.createReadStream(csvFilepath, "utf8");

  return new Promise((resolve, reject) => {
    inputStream
      .pipe(
        new CsvReadableStream({
          parseNumbers: true,
          trim: true,
          asObject: true,
        })
      )
      .on("data", (row) => {
        //@ts-ignore TODO
        output.push(row);
      })
      .on("end", () => resolve(output))
      .on("error", (err) => reject(err));
  });
};

const main = async () => {
  // const response = await fetch(DATA_ENDPOINT);
  // const data = await response.json();

  // const [xValues, yValues] = transformApiResponse(data);

  // const regression = new SimpleLinearRegression(xValues, yValues);

  // const render = await renderChart(data, regression);

  // return [regression, render] as const;

  const csvReadPromises = ["24h", "48h", "72h", "96h"].map(
    async (timepoint) => {
      const [dapiData, dicData] = await Promise.all(
        ["DAPI", "DIC"].map(async (countingTechnique) => {
          const csvFilepath = path.resolve(
            __dirname,
            `../task1_data/task1_data - ${countingTechnique}-${timepoint}.csv`
          );

          const parsedCSV = await readCSVToObject(csvFilepath);

          return countingTechnique === "DIC"
            ? transformDICData(parsedCSV)
            : (parsedCSV as DICRow[]);
        })
      );

      const dataset = dapiData.map((row, index) => {
        const { Count: dapiCount } = row;
        const { Count: dicCount } = dicData[index];

        return {
          x: dicCount,
          y: dapiCount,
        };
      });

      const regression = new SimpleLinearRegression(
        dicData.map(({ Count: count }) => count),
        dapiData.map(({ Count: count }) => count)
      );

      const chartTitle = `${timepoint} - DAPI vs DIC Count`;
      const chartData = await renderChart(dataset, regression, chartTitle, ['DIC Count', 'DAPI Count']);

      await fs.promises.writeFile(`${chartTitle}.png`, chartData);
    }
  );
};

main();

export { main };
