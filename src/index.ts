import fetch from "node-fetch";
import SimpleLinearRegression from "ml-regression-simple-linear";

const DATA_ENDPOINT = "https://some-url";

const transformApiResponse = (
  data: { x: number; y: number }[]
): [number[], number[]] => {
  return [data.map(({ x }) => x), data.map(({ y }) => y)];
};

const main = async () => {
  const response = await fetch(DATA_ENDPOINT);
  const data = await response.json();

  const [xValues, yValues] = transformApiResponse(data);

  return new SimpleLinearRegression(xValues, yValues);
};

export { main };
