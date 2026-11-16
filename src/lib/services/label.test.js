import { describe, expect, it } from 'vitest';
import { getModalLabelAttrs, getToggleLabelAttrs } from './label.js';

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

describe('getModalLabelAttrs', () => {
  it('points at the title in the built-in header', () => {
    expect(
      getModalLabelAttrs({
        id: 'd1',
        title: 'Title',
        ariaLabelledby: undefined,
        hasCustomHeader: false,
      }),
    ).toEqual({ 'aria-label': undefined, 'aria-labelledby': 'd1-title' });
  });

  it('uses the title as the accessible name with a custom header', () => {
    expect(
      getModalLabelAttrs({
        id: 'd1',
        title: 'Title',
        ariaLabelledby: undefined,
        hasCustomHeader: true,
      }),
    ).toEqual({ 'aria-label': 'Title', 'aria-labelledby': undefined });
  });

  it('points at the labelling element named by the consumer', () => {
    expect(
      getModalLabelAttrs({ id: 'd1', title: 'Title', ariaLabelledby: 'x', hasCustomHeader: true }),
    ).toEqual({ 'aria-label': undefined, 'aria-labelledby': 'x' });
    expect(
      getModalLabelAttrs({
        id: 'd1',
        title: undefined,
        ariaLabelledby: 'x',
        hasCustomHeader: false,
      }),
    ).toEqual({ 'aria-label': undefined, 'aria-labelledby': 'x' });
  });

  it('sets neither attribute without any title', () => {
    expect(
      getModalLabelAttrs({
        id: 'd1',
        title: '',
        ariaLabelledby: undefined,
        hasCustomHeader: false,
      }),
    ).toEqual({ 'aria-label': undefined, 'aria-labelledby': undefined });
  });
});
