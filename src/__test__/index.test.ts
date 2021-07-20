import { main } from '../index';

const x = [0.5, 1, 1.5, 2, 2.5];
const y = [0, 1, 2, 3, 4];

const mockData = x.map((xValue, index) => ({
  x: xValue,
  y: y[index]
}));

jest.mock('node-fetch', () => ({
  __esModule: true,
  default: async () => ({ json: async () => mockData })
}))

describe('index.ts', () => {
  it('should correctly run regression', async () => {
    const regressionResult = await main();

    expect(regressionResult.intercept).toEqual(-1);
    expect(regressionResult.slope).toEqual(2);
  });
});