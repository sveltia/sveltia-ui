import { describe, expect, it } from 'vitest';
import {
  getAccessibleName,
  getLabelAboveText,
  getModalLabelAttrs,
  getToggleLabelAttrs,
  getWidgetStateAttrs,
} from './label.js';

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

describe('getWidgetStateAttrs', () => {
  it('mirrors the state props as ARIA attributes', () => {
    expect(
      getWidgetStateAttrs({
        hidden: false,
        disabled: true,
        readonly: false,
        required: true,
        invalid: undefined,
      }),
    ).toEqual({
      'aria-hidden': false,
      'aria-disabled': true,
      'aria-readonly': false,
      'aria-required': true,
      'aria-invalid': undefined,
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

describe('getLabelAboveText', () => {
  it('should return the accessible name given as a prop or as an attribute', () => {
    expect(getLabelAboveText({ showLabelAbove: true, props: { ariaLabel: 'Name' } })).toBe('Name');
    expect(getLabelAboveText({ showLabelAbove: true, props: { 'aria-label': 'Name' } })).toBe(
      'Name',
    );
  });

  it('should return nothing without the option or a name', () => {
    expect(getLabelAboveText({ showLabelAbove: false, props: { ariaLabel: 'Name' } })).toBe(
      undefined,
    );
    expect(getLabelAboveText({ showLabelAbove: true, props: { ariaLabel: '' } })).toBe(undefined);
    expect(getLabelAboveText({ showLabelAbove: true, props: {} })).toBe(undefined);
  });
});

describe('getAccessibleName', () => {
  it('should prefer the prop to the attribute', () => {
    expect(getAccessibleName({ ariaLabel: 'Prop', props: { 'aria-label': 'Attr' } })).toBe('Prop');
    expect(getAccessibleName({ ariaLabel: undefined, props: { 'aria-label': 'Attr' } })).toBe(
      'Attr',
    );
  });

  it('should treat an empty name as none', () => {
    expect(getAccessibleName({ ariaLabel: '', props: { 'aria-label': 'Attr' } })).toBe('Attr');
    expect(getAccessibleName({ ariaLabel: '', props: { 'aria-label': '' } })).toBe(undefined);
    expect(getAccessibleName({ ariaLabel: undefined, props: {} })).toBe(undefined);
  });
});
