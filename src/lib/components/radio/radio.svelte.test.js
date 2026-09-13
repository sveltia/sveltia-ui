import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import Radio from './radio.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

describe('Radio', () => {
  it('renders an unchecked radio labelled by its label', async () => {
    const screen = await render(Radio, {
      label: 'Red',
      class: 'custom',
      name: 'color',
      value: 'red',
    });

    const radio = screen.getByRole('radio', { name: 'Red' });
    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.radio'));

    await expect.element(radio).toHaveAttribute('aria-checked', 'false');
    await expect.element(radio).toHaveAttribute('data-name', 'color');
    await expect.element(radio).toHaveAttribute('data-value', 'red');
    expect(wrapper.classList.contains('custom')).toBe(true);
    expect(radio.element().getAttribute('aria-labelledby')).toBe(
      wrapper.querySelector('label')?.id,
    );
  });

  it('renders children as the label, or no label at all', async () => {
    const withChildren = await render(Radio, { children: text('Rich') });

    expect(withChildren.container.querySelector('label')?.textContent?.trim()).toBe('Rich');

    const bare = await render(Radio, {});

    expect(bare.container.querySelector('label')).toBeNull();
  });

  it('becomes checked when clicked, and stays checked', async () => {
    const screen = await render(Radio, { label: 'Red' });
    const radio = screen.getByRole('radio');

    await radio.click();
    await expect.element(radio).toHaveAttribute('aria-checked', 'true');
    await radio.click();
    await expect.element(radio).toHaveAttribute('aria-checked', 'true');
  });

  it('becomes checked when the label is clicked', async () => {
    const screen = await render(Radio, { label: 'Red' });

    await screen.getByText('Red').click();
    await expect.element(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'true');
  });

  it('ignores clicks while disabled', async () => {
    const screen = await render(Radio, { label: 'Red', disabled: true });

    const radio = /** @type {HTMLButtonElement} */ (
      screen.container.querySelector('[role="radio"]')
    );

    expect(radio.disabled).toBe(true);
    expect(screen.container.querySelector('.sui.radio')?.classList.contains('disabled')).toBe(true);
    radio.click();
    expect(radio.getAttribute('aria-checked')).toBe('false');
  });

  it('syncs with a bound group value', async () => {
    /** @type {ComponentProps<typeof Radio>} */
    const props = $state({ label: 'Red', value: 'red', group: 'blue' });
    const screen = await render(Radio, props);
    const radio = screen.getByRole('radio');

    await expect.element(radio).toHaveAttribute('aria-checked', 'false');
    await radio.click();
    expect(props.group).toBe('red');
    await expect.element(radio).toHaveAttribute('aria-checked', 'true');
    props.group = 'blue';
    await expect.element(radio).toHaveAttribute('aria-checked', 'false');
  });

  it('can be hidden', async () => {
    const screen = await render(Radio, { hidden: true });

    expect(/** @type {HTMLElement} */ (screen.container.querySelector('.sui.radio')).hidden).toBe(
      true,
    );
  });
});
