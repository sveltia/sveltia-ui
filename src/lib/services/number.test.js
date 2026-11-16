import { describe, expect, it } from 'vitest';
import { getMaximumFractionDigits, normalizeStep } from './number.js';

describe('normalizeStep', () => {
  it('should keep a positive step', () => {
    expect(normalizeStep(1)).toBe(1);
    expect(normalizeStep(0.5)).toBe(0.5);
  });

  it('should fall back to 1 for a step that isn’t a positive number', () => {
    expect(normalizeStep(0)).toBe(1);
    expect(normalizeStep(-2)).toBe(1);
    expect(normalizeStep(null)).toBe(1);
    expect(normalizeStep(undefined)).toBe(1);
    expect(normalizeStep(Number.NaN)).toBe(1);
    expect(normalizeStep(Infinity)).toBe(1);
  });
});

describe('getMaximumFractionDigits', () => {
  it('should return 0 for an integer', () => {
    expect(getMaximumFractionDigits(1)).toBe(0);
    expect(getMaximumFractionDigits(10)).toBe(0);
    expect(getMaximumFractionDigits(-3)).toBe(0);
  });

  it('should count the fraction digits of a decimal', () => {
    expect(getMaximumFractionDigits(0.1)).toBe(1);
    expect(getMaximumFractionDigits(0.25)).toBe(2);
    expect(getMaximumFractionDigits(2.005)).toBe(3);
    expect(getMaximumFractionDigits(-0.5)).toBe(1);
  });

  it('should count the fraction digits of a number in exponent notation', () => {
    expect(getMaximumFractionDigits(1e-7)).toBe(7);
    expect(getMaximumFractionDigits(1.5e-7)).toBe(8);
    expect(getMaximumFractionDigits(1e21)).toBe(0);
    expect(getMaximumFractionDigits(1e-150)).toBe(150);
  });
});
