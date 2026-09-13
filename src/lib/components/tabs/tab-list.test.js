import { describe, expect, it } from 'vitest';
import { getIndicatorStyle } from './tab-list.js';

describe('getIndicatorStyle', () => {
  it('should place the indicator over the tab', () => {
    expect(
      getIndicatorStyle({ offsetTop: 4, offsetLeft: 120, offsetWidth: 80, offsetHeight: 32 }),
    ).toBe('top: 4px; left: 120px; width: 80px; height: 32px');
  });

  it('should accept zero values', () => {
    expect(
      getIndicatorStyle({ offsetTop: 0, offsetLeft: 0, offsetWidth: 0, offsetHeight: 0 }),
    ).toBe('top: 0px; left: 0px; width: 0px; height: 0px');
  });
});
