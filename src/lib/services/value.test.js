import { describe, expect, it } from 'vitest';
import { castValue, getSelectedItemDetail, getValueType } from './value.js';

describe('getValueType', () => {
  it('should return the type of a value, typing `null` as `null`', () => {
    expect(getValueType('a')).toBe('string');
    expect(getValueType(1)).toBe('number');
    expect(getValueType(false)).toBe('boolean');
    expect(getValueType(null)).toBe('null');
    expect(getValueType(undefined)).toBe('undefined');
  });
});

describe('castValue', () => {
  it('should cast a number, falling back to `null` for a non-numeric value', () => {
    expect(castValue('42', 'number')).toBe(42);
    expect(castValue('abc', 'number')).toBeNull();
    expect(castValue(undefined, 'number')).toBeNull();
  });

  it('should cast a boolean', () => {
    expect(castValue('true', 'boolean')).toBe(true);
    expect(castValue('false', 'boolean')).toBe(false);
  });

  it('should cast `null`', () => {
    expect(castValue(undefined, 'null')).toBeNull();
  });

  it('should cast a string, falling back to an empty string', () => {
    expect(castValue('hello', 'string')).toBe('hello');
    expect(castValue(undefined, 'string')).toBe('');
  });

  it('should return any other type as is', () => {
    expect(castValue('x', 'object')).toBe('x');
    expect(castValue(undefined, 'undefined')).toBeUndefined();
  });

  it('should round-trip a value through its data type', () => {
    [true, false, null, 0, 1.5, 'a', ''].forEach((value) => {
      const attr = value === null ? undefined : String(value);

      expect(castValue(attr, getValueType(value))).toBe(value);
    });
  });
});

/**
 * Helper to create a minimal element-like object with the given dataset values.
 * @param {Record<string, string>} dataset Dataset key-value pairs.
 * @returns {HTMLElement} A fake element with the given dataset.
 */
const makeElement = (dataset) => /** @type {HTMLElement} */ (/** @type {unknown} */ ({ dataset }));

describe('getSelectedItemDetail', () => {
  it('should return null when type is null', () => {
    const el = makeElement({ type: 'null' });
    const detail = getSelectedItemDetail(el);

    expect(detail.type).toBe('null');
    expect(detail.value).toBeNull();
  });

  it('should return a string value by default', () => {
    const el = makeElement({ value: 'hello', name: 'field', label: 'Hello' });
    const detail = getSelectedItemDetail(el);

    expect(detail.type).toBe('string');
    expect(detail.value).toBe('hello');
    expect(detail.name).toBe('field');
    expect(detail.label).toBe('Hello');
    expect(detail.target).toBe(el);
  });

  it('should coerce value to empty string when value is absent and type is string', () => {
    const el = makeElement({ name: 'field' });
    const detail = getSelectedItemDetail(el);

    expect(detail.type).toBe('string');
    expect(detail.value).toBe('');
  });

  it('should return a number value when type is number', () => {
    const el = makeElement({ type: 'number', value: '42' });
    const detail = getSelectedItemDetail(el);

    expect(detail.type).toBe('number');
    expect(detail.value).toBe(42);
  });

  it('should return null for a non-numeric value when type is number', () => {
    const el = makeElement({ type: 'number', value: 'abc' });
    const detail = getSelectedItemDetail(el);

    expect(detail.value).toBeNull();
  });

  it('should return true for "true" when type is boolean', () => {
    const el = makeElement({ type: 'boolean', value: 'true' });
    const detail = getSelectedItemDetail(el);

    expect(detail.type).toBe('boolean');
    expect(detail.value).toBe(true);
  });

  it('should return false for any non-"true" string when type is boolean', () => {
    const el = makeElement({ type: 'boolean', value: 'false' });
    const detail = getSelectedItemDetail(el);

    expect(detail.value).toBe(false);
  });

  it('should leave value unchanged for an unknown/custom type (else-if string branch false)', () => {
    const el = makeElement({ type: 'date', value: '2024-01-01' });
    const detail = getSelectedItemDetail(el);

    expect(detail.type).toBe('date');
    // value is the raw dataset string when type is not string/number/boolean
    expect(detail.value).toBe('2024-01-01');
  });
});
