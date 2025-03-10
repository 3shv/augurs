import { readFileSync } from "node:fs";

import {
  Prophet,
  ProphetHoliday,
  ProphetHolidayOccurrence,
  ProphetRegressor,
  ProphetSeasonality,
  ProphetSeasonalityOption,
  initSync
} from '@bsull/augurs/prophet';
import { optimizer } from '@bsull/augurs-prophet-wasmstan';

import { describe, expect, it } from 'vitest';

initSync({ module: readFileSync('node_modules/@bsull/augurs/prophet_bg.wasm') });

const ds = [1704067200, 1704871384, 1705675569, 1706479753, 1707283938, 1708088123,
  1708892307, 1709696492, 1710500676, 1711304861, 1712109046, 1712913230,
];
const y = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0];
const cap = Array(y.length).fill(12.0);
const floor = Array(y.length).fill(0.0);

describe('Prophet', () => {
  it('can be instantiated', () => {
    const prophet = new Prophet({ optimizer });
    expect(prophet).toBeInstanceOf(Prophet);
  });

  it('can be fit with arrays', () => {
    const prophet = new Prophet({ optimizer });
    prophet.fit({ ds, y })
    const preds = prophet.predict();
    expect(preds.yhat.point).toHaveLength(y.length);
  });

  it('can be fit with typed arrays', () => {
    const prophet = new Prophet({ optimizer });
    prophet.fit({ ds: new BigInt64Array(ds.map(BigInt)), y: new Float64Array(y) });
    const preds = prophet.predict();
    expect(preds.yhat.point).toHaveLength(y.length);
  });

  it('accepts cap/floor', () => {
    const prophet = new Prophet({ optimizer });
    prophet.fit({ ds, y, cap, floor });
    const preds = prophet.predict();
    expect(preds.yhat.point).toHaveLength(y.length);
  });

  it('returns regular arrays', () => {
    const prophet = new Prophet({ optimizer });
    prophet.fit({ ds, y })
    const preds = prophet.predict();
    expect(preds.yhat.point).toHaveLength(y.length);
    expect(preds.yhat.point).toBeInstanceOf(Array);
  });

  describe('holidays', () => {
    it('can be set', () => {
      const occurrences: ProphetHolidayOccurrence[] = [
        { start: new Date('2024-12-25').getTime() / 1000, end: new Date('2024-12-26').getTime() / 1000 },
      ]
      const holidays: Map<string, ProphetHoliday> = new Map([
        ["Christmas", { occurrences }],
      ]);
      new Prophet({ optimizer, holidays });
    });
  })

  describe('seasonality', () => {
    it('can be set', () => {
        const dailySeasonality: ProphetSeasonalityOption = { type: "manual", enabled: false };
        const prophet = new Prophet({ optimizer, dailySeasonality });
        const seasonality: ProphetSeasonality = { period: 30.5, fourierOrder: 5 };
        prophet.addSeasonality('daily', seasonality);
    });
  });

  describe('regressors', () => {
    it('can be set', () => {
      const reg: ProphetRegressor = {mode: "additive", priorScale: 0.5, standardize: "auto"};
      const prophet = new Prophet({optimizer});
      prophet.addRegressor('feature1', reg);
    });

    it('can be set with just name', () => {
      const prophet = new Prophet({optimizer});
      prophet.addRegressor('feature1');
    });

    it('can be set with name using mode', () => {
      const reg: ProphetRegressor = {mode: "multiplicative"};
      const prophet = new Prophet({optimizer});
      prophet.addRegressor('feature1', reg);
    });
  });
});
