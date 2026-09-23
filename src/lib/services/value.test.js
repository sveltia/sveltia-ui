import { describe, expect, it } from 'vitest';
import { castValue, getValueType } from './value.js';

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
