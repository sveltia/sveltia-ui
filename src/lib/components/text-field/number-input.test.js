import { describe, expect, it, vi } from 'vitest';
import {
  getDecimalSeparator,
  getInputMode,
  isAtMax,
  isAtMin,
  isInvalidNumber,
  normalizeNumber,
  parseNumber,
  stepNumber,
} from './number-input.js';

describe('getInputMode', () => {
  it('should use the text keyboard when a negative number is allowed', () => {
    expect(getInputMode({ fractional: false })).toBe('text');
    expect(getInputMode({ fractional: true, min: -1 })).toBe('text');
  });

  it('should use the numeric or decimal keypad for a non-negative number', () => {
    expect(getInputMode({ fractional: false, min: 0 })).toBe('numeric');
    expect(getInputMode({ fractional: true, min: 1 })).toBe('decimal');
  });
});

describe('getDecimalSeparator', () => {
  it('should return the decimal separator of the locale', () => {
    expect(getDecimalSeparator('en')).toBe('.');
    expect(getDecimalSeparator('de')).toBe(',');
    expect(getDecimalSeparator('fr-CA')).toBe(',');
  });

  it('should fall back to the default locale', () => {
    expect(getDecimalSeparator(undefined)).toBe(getDecimalSeparator(navigator.language));
    expect(getDecimalSeparator('')).toBe(getDecimalSeparator(navigator.language));
  });

  it('should look up the separator of a locale only once', () => {
    const spy = vi.spyOn(Intl, 'NumberFormat');

    getDecimalSeparator('pt-BR');
    getDecimalSeparator('pt-BR');
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it('should return a period for an invalid locale', () => {
    expect(getDecimalSeparator('not a locale')).toBe('.');
  });
});

describe('normalizeNumber', () => {
  it('should accept the decimal separator of the locale', () => {
    expect(normalizeNumber('1,5', 'de')).toBe('1.5');
    expect(normalizeNumber('-0,25', 'fr')).toBe('-0.25');
    expect(parseNumber(normalizeNumber('1,5', 'de'))).toBe(1.5);
  });

  it('should not read a comma as a decimal separator where it’s not one', () => {
    expect(normalizeNumber('1,5', 'en')).toBe('1,5');
    expect(parseNumber(normalizeNumber('1,500', 'en'))).toBeUndefined();
  });

  it('should leave text with a period or several decimal separators as is', () => {
    expect(normalizeNumber('1.5', 'de')).toBe('1.5');
    expect(normalizeNumber('1.500,5', 'de')).toBe('1.500,5');
    expect(normalizeNumber('1,2,3', 'de')).toBe('1,2,3');
    expect(normalizeNumber('', 'de')).toBe('');
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
    expect(stepNumber('20', { step: 10, direction: 1 })).toBe('30');
  });

  it('should keep the fraction digits of a step in exponent notation', () => {
    expect(stepNumber('0', { step: 1e-7, direction: 1 })).toBe('0.0000001');
  });

  it('should step from zero when the field is empty', () => {
    expect(stepNumber('', { step: 1, direction: 1 })).toBe('1');
    expect(stepNumber('', { step: 1, direction: -1 })).toBe('-1');
  });

  it('should format decimals to the step’s precision', () => {
    expect(stepNumber('0.2', { step: 0.1, direction: 1 })).toBe('0.3');
    expect(stepNumber('1', { step: 0.25, direction: -1 })).toBe('0.75');
  });

  it('should snap a value off the step grid to the grid, as the native number input does', () => {
    expect(stepNumber('2.5', { step: 1, direction: 1 })).toBe('3');
    expect(stepNumber('5', { step: 10, direction: 1 })).toBe('10');
    expect(stepNumber('2.5', { step: 1, direction: -1 })).toBe('2');
    expect(stepNumber('-0.5', { step: 1, direction: 1 })).toBe('0');
    expect(stepNumber('0.15', { step: 0.1, direction: -1 })).toBe('0.1');
    expect(stepNumber('1.25', { step: 0.1, direction: 1 })).toBe('1.3');
    expect(stepNumber('0.3', { step: 0.1, direction: 1 })).toBe('0.4');
  });

  it('should base the step grid on the minimum', () => {
    expect(stepNumber('1.5', { step: 1, direction: 1, min: 0.5 })).toBe('2.5');
    expect(stepNumber('2', { step: 1, direction: 1, min: 0.5 })).toBe('2.5');
    expect(stepNumber('2', { step: 1, direction: -1, min: 0.5 })).toBe('1.5');
  });

  it('should not step past the limits', () => {
    expect(stepNumber('10', { step: 1, direction: 1, max: 10 })).toBeUndefined();
    expect(stepNumber('0', { step: 1, direction: -1, min: 0 })).toBeUndefined();
    expect(stepNumber('9', { step: 1, direction: 1, max: 10 })).toBe('10');
  });

  it('should stop at the limit rather than overshoot it', () => {
    expect(stepNumber('9.5', { step: 1, direction: 1, max: 10 })).toBe('10');
    expect(stepNumber('0.5', { step: 1, direction: -1, min: 0 })).toBe('0');
    expect(stepNumber('10', { step: 1, direction: 1, max: 10.5 })).toBe('10.5');
    expect(stepNumber('15', { step: 1, direction: -1, max: 10 })).toBe('10');
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
