import { describe, expect, it } from 'vitest';
import { getSelectedItemDetail } from './select.svelte.js';

/**
 * Helper to create a minimal element-like object with the given dataset values.
 * @param {Record<string, string>} dataset Dataset key-value pairs.
 * @returns {HTMLElement} A fake element with the given dataset.
 */
const makeElement = (dataset) => /** @type {HTMLElement} */ (/** @type {unknown} */ ({ dataset }));

describe('getSelectedItemDetail', () => {
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
