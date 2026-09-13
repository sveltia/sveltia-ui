import { describe, expect, it } from 'vitest';
import {
  getMaximumFractionDigits,
  isAtMax,
  isAtMin,
  isInvalidNumber,
  parseNumber,
  stepNumber,
} from './number-input.js';

describe('getMaximumFractionDigits', () => {
  it('should return 0 for an integer step', () => {
    expect(getMaximumFractionDigits(1)).toBe(0);
    expect(getMaximumFractionDigits(10)).toBe(0);
  });

  it('should count the fraction digits of a decimal step', () => {
    expect(getMaximumFractionDigits(0.1)).toBe(1);
    expect(getMaximumFractionDigits(0.25)).toBe(2);
    expect(getMaximumFractionDigits(2.005)).toBe(3);
  });
});

describe('parseNumber', () => {
  it('should parse integers and decimals', () => {
    expect(parseNumber('42')).toBe(42);
    expect(parseNumber('-3.5')).toBe(-3.5);
    expect(parseNumber(' 7 ')).toBe(7);
  });

  it('should return undefined for an empty or blank field', () => {
    expect(parseNumber('')).toBeUndefined();
    expect(parseNumber('   ')).toBeUndefined();
  });

  it('should return undefined for text that is not a number', () => {
    expect(parseNumber('abc')).toBeUndefined();
    expect(parseNumber('1,000')).toBeUndefined();
  });
});

describe('isAtMin / isAtMax', () => {
  it('should be false without a limit', () => {
    expect(isAtMin('0', undefined)).toBe(false);
    expect(isAtMax('100', undefined)).toBe(false);
  });

  it('should compare the field with the limit', () => {
    expect(isAtMin('5', 5)).toBe(true);
    expect(isAtMin('4', 5)).toBe(true);
    expect(isAtMin('6', 5)).toBe(false);
    expect(isAtMax('5', 5)).toBe(true);
    expect(isAtMax('6', 5)).toBe(true);
    expect(isAtMax('4', 5)).toBe(false);
  });

  it('should treat an empty field as zero', () => {
    expect(isAtMin('', 0)).toBe(true);
    expect(isAtMin('', -1)).toBe(false);
    expect(isAtMax('', 0)).toBe(true);
  });
});

describe('stepNumber', () => {
  it('should add or subtract the step', () => {
    expect(stepNumber('5', { step: 1, direction: 1 })).toBe('6');
    expect(stepNumber('5', { step: 1, direction: -1 })).toBe('4');
    expect(stepNumber('5', { step: 10, direction: 1 })).toBe('15');
  });

  it('should step from zero when the field is empty', () => {
    expect(stepNumber('', { step: 1, direction: 1 })).toBe('1');
    expect(stepNumber('', { step: 1, direction: -1 })).toBe('-1');
  });

  it('should format decimals to the step’s precision', () => {
    expect(stepNumber('0.2', { step: 0.1, direction: 1 })).toBe('0.3');
    expect(stepNumber('1', { step: 0.25, direction: -1 })).toBe('0.75');
  });

  it('should not step past the limits', () => {
    expect(stepNumber('10', { step: 1, direction: 1, max: 10 })).toBeUndefined();
    expect(stepNumber('0', { step: 1, direction: -1, min: 0 })).toBeUndefined();
    expect(stepNumber('9', { step: 1, direction: 1, max: 10 })).toBe('10');
  });

  it('should leave a non-numeric field alone', () => {
    expect(stepNumber('abc', { step: 1, direction: 1 })).toBeUndefined();
  });
});

describe('isInvalidNumber', () => {
  it('should accept an empty field unless a value is required', () => {
    expect(isInvalidNumber('')).toBe(false);
    expect(isInvalidNumber('', { required: true })).toBe(true);
    expect(isInvalidNumber('   ', { required: true })).toBe(true);
  });

  it('should reject text that is not a number', () => {
    expect(isInvalidNumber('abc')).toBe(true);
    expect(isInvalidNumber('12', { required: true })).toBe(false);
  });

  it('should check the range', () => {
    expect(isInvalidNumber('5', { min: 0, max: 10 })).toBe(false);
    expect(isInvalidNumber('-1', { min: 0 })).toBe(true);
    expect(isInvalidNumber('11', { max: 10 })).toBe(true);
    expect(isInvalidNumber('0', { min: 0 })).toBe(false);
    expect(isInvalidNumber('10', { max: 10 })).toBe(false);
  });
});
