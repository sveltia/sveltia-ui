import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { html, text } from '../../test-utils/snippets.js';
import Option from './option.svelte';
import OptionRegistryFixture from './option-registry-fixture.test.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 * @import { OptionRegistry } from '../../services/select.svelte.js';
 */

describe('Option', () => {
  it('renders an option button with the label as the default value', async () => {
    const screen = await render(Option, { label: 'Apple', class: 'custom', name: 'fruit' });
    const option = screen.getByRole('option', { name: 'Apple' });
    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.option'));

    await expect.element(option).toHaveAttribute('tabindex', '-1');
    await expect.element(option).toHaveAttribute('aria-selected', 'false');
    await expect.element(option).toHaveAttribute('data-value', 'Apple');
    await expect.element(option).toHaveAttribute('data-search-value', 'Apple');
    await expect.element(option).toHaveAttribute('data-name', 'fruit');
    expect(option.element().id).toBeTruthy();
    expect(wrapper.classList.contains('custom')).toBe(true);
    expect(wrapper.classList.contains('wrap')).toBe(false);
    expect(option.element().querySelector('.icon')).toBeNull();
  });

  it('uses the given value, search value, ID and wrapping', async () => {
    const screen = await render(Option, {
      label: 'Apple',
      value: 1,
      searchValue: 'red fruit',
      id: 'opt-1',
      wrap: true,
    });

    const option = screen.getByRole('option');

    await expect.element(option).toHaveAttribute('data-value', '1');
    await expect.element(option).toHaveAttribute('data-type', 'number');
    await expect.element(option).toHaveAttribute('data-search-value', 'red fruit');
    expect(option.element().id).toBe('opt-1');
    expect(screen.container.querySelector('.sui.option')?.classList.contains('wrap')).toBe(true);
  });

  it('shows the check icon while selected, or a custom one', async () => {
    const screen = await render(Option, { label: 'Apple', selected: true });

    expect(screen.container.querySelector('.icon.check')?.textContent?.trim()).toBe('check');

    const custom = await render(Option, {
      label: 'Apple',
      selected: true,
      checkIcon: html('<i class="custom-check">x</i>'),
    });

    expect(custom.container.querySelector('.custom-check')).not.toBeNull();
    expect(custom.container.querySelector('.icon.check')).toBeNull();
  });

  it('renders the start icon and children', async () => {
    const screen = await render(Option, {
      label: 'Apple',
      startIcon: html('<i class="start">S</i>'),
      children: text('Extra'),
    });

    const option = /** @type {HTMLElement} */ (screen.container.querySelector('[role="option"]'));

    expect(option.querySelector('.start')).not.toBeNull();
    expect(option.textContent).toContain('Extra');
  });

  it('follows the Change and Toggle events from the parent listbox', async () => {
    const onChange = vi.fn();
    const onToggle = vi.fn();
    /** @type {ComponentProps<typeof Option>} */
    const props = $state({ label: 'Apple', selected: false, hidden: false, onChange, onToggle });
    const screen = await render(Option, props);
    const option = /** @type {HTMLElement} */ (screen.container.querySelector('[role="option"]'));

    option.dispatchEvent(new CustomEvent('Change', { detail: { selected: true } }));
    expect(props.selected).toBe(true);
    expect(onChange).toHaveBeenCalledOnce();

    option.dispatchEvent(new CustomEvent('Toggle', { detail: { hidden: true } }));
    expect(props.hidden).toBe(true);
    // A hidden option is deselected
    expect(props.selected).toBe(false);
    expect(onToggle).toHaveBeenCalledOnce();
    await vi.waitFor(() => {
      expect(
        /** @type {HTMLElement} */ (screen.container.querySelector('.sui.option')).hidden,
      ).toBe(true);
    });
  });

  it('reflects the disabled state', async () => {
    const screen = await render(Option, { label: 'Apple', disabled: true });

    const option = /** @type {HTMLButtonElement} */ (
      screen.container.querySelector('[role="option"]')
    );

    expect(option.disabled).toBe(true);
    expect(option.getAttribute('aria-disabled')).toBe('true');
  });

  it('registers with an ancestor combobox and only renders while expanded', async () => {
    /** @type {ComponentProps<typeof OptionRegistryFixture>} */
    const props = $state({ registry: undefined, expanded: false, selected: true, disabled: true });
    const screen = await render(OptionRegistryFixture, props);
    const { registry } = /** @type {{ registry: OptionRegistry }} */ (props);

    expect(registry.count).toBe(1);
    expect(screen.container.querySelector('[role="option"]')).toBeNull();

    const entry = /** @type {NonNullable<ReturnType<typeof registry.find>>} */ (
      registry.find('apple')
    );

    expect(entry.label).toBe('Apple');
    expect(entry.name).toBe('fruit');
    expect(entry.type).toBe('string');
    expect(entry.selected).toBe(true);
    expect(entry.disabled).toBe(true);

    // The entry reads the props live, and writes the selected state back
    props.disabled = false;
    expect(entry.disabled).toBe(false);
    entry.selected = false;
    expect(props.selected).toBe(false);

    props.expanded = true;
    await vi.waitFor(() => {
      expect(screen.container.querySelector('[role="option"]')).not.toBeNull();
    });

    props.expanded = false;
    await vi.waitFor(() => {
      expect(screen.container.querySelector('[role="option"]')).toBeNull();
    });
  });

  it('unregisters from the registry when unmounted', async () => {
    /** @type {ComponentProps<typeof OptionRegistryFixture>} */
    const props = $state({ registry: undefined });
    const screen = await render(OptionRegistryFixture, props);
    const { registry } = /** @type {{ registry: OptionRegistry }} */ (props);

    expect(registry.count).toBe(1);
    await screen.unmount();
    expect(registry.count).toBe(0);
  });
});
