import { describe, expect, it } from 'vitest';
import { getSelectedItemDetail, OptionRegistry } from './select.svelte.js';

/**
 * Helper to create an option entry backed by plain properties, standing in for the accessors an
 * `<Option>` registers.
 * @param {any} value The option’s value.
 * @param {string} label The option’s text label.
 * @param {boolean} [selected] Whether the option is selected.
 * @returns {import('$lib/typedefs').OptionEntry} A fake entry.
 */
const makeEntry = (value, label, selected = false) => ({
  value,
  label,
  name: undefined,
  type: typeof value,
  selected,
  disabled: false,
});

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

describe('OptionRegistry', () => {
  it('should start collapsed and empty', () => {
    const registry = new OptionRegistry();

    expect(registry.expanded).toBe(false);
    expect(registry.count).toBe(0);
    expect(registry.selectedEntry).toBeUndefined();
  });

  it('should count the registered options', () => {
    const registry = new OptionRegistry();

    registry.register(makeEntry('a', 'Apple'));
    registry.register(makeEntry('b', 'Banana'));

    expect(registry.count).toBe(2);
  });

  it('should remove an option with the returned function', () => {
    const registry = new OptionRegistry();
    const unregister = registry.register(makeEntry('a', 'Apple'));

    registry.register(makeEntry('b', 'Banana'));
    unregister();

    expect(registry.count).toBe(1);
    expect(registry.find('a')).toBeUndefined();
    expect(registry.find('b')?.label).toBe('Banana');
  });

  it('should be a no-op when the same option is unregistered twice', () => {
    const registry = new OptionRegistry();
    const unregister = registry.register(makeEntry('a', 'Apple'));

    unregister();
    unregister();

    expect(registry.count).toBe(0);
  });

  it('should find an option by value, including falsy values', () => {
    const registry = new OptionRegistry();

    registry.register(makeEntry('', 'Empty'));
    registry.register(makeEntry(0, 'Zero'));
    registry.register(makeEntry(false, 'False'));

    expect(registry.find('')?.label).toBe('Empty');
    expect(registry.find(0)?.label).toBe('Zero');
    expect(registry.find(false)?.label).toBe('False');
    expect(registry.find('missing')).toBeUndefined();
  });

  it('should not confuse a numeric value with its string form', () => {
    const registry = new OptionRegistry();

    registry.register(makeEntry(1, 'One'));

    expect(registry.find(1)?.label).toBe('One');
    expect(registry.find('1')).toBeUndefined();
  });

  it('should report the option marked as selected', () => {
    const registry = new OptionRegistry();

    registry.register(makeEntry('a', 'Apple'));
    registry.register(makeEntry('b', 'Banana', true));

    expect(registry.selectedEntry?.label).toBe('Banana');
  });

  it('should select exactly one option and deselect the others', () => {
    const registry = new OptionRegistry();
    const apple = makeEntry('a', 'Apple', true);
    const banana = makeEntry('b', 'Banana');
    const cherry = makeEntry('c', 'Cherry', true);

    registry.register(apple);
    registry.register(banana);
    registry.register(cherry);
    registry.selectOnly('b');

    expect(apple.selected).toBe(false);
    expect(banana.selected).toBe(true);
    expect(cherry.selected).toBe(false);
  });

  it('should deselect everything when selecting an unknown value', () => {
    const registry = new OptionRegistry();
    const apple = makeEntry('a', 'Apple', true);

    registry.register(apple);
    registry.selectOnly('missing');

    expect(apple.selected).toBe(false);
    expect(registry.selectedEntry).toBeUndefined();
  });
});
