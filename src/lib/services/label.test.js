import { describe, expect, it } from 'vitest';
import { getToggleLabelAttrs } from './label.js';

describe('getToggleLabelAttrs', () => {
  it('points at the visible label when there is no accessible name', () => {
    expect(getToggleLabelAttrs({ id: 'c1', ariaLabel: undefined, hasVisibleLabel: true })).toEqual({
      'aria-label': undefined,
      'aria-labelledby': 'c1-label',
    });
  });

  it('uses the accessible name in place of the visible label', () => {
    expect(getToggleLabelAttrs({ id: 'c1', ariaLabel: 'Name', hasVisibleLabel: true })).toEqual({
      'aria-label': 'Name',
      'aria-labelledby': undefined,
    });
  });

  it('sets neither attribute without any label', () => {
    expect(getToggleLabelAttrs({ id: 'c1', ariaLabel: '', hasVisibleLabel: false })).toEqual({
      'aria-label': undefined,
      'aria-labelledby': undefined,
    });
  });
});
