import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ComboboxFixture from './combobox-fixture.test.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

it('renders a non-editable combobox with the state attributes', async () => {
  const screen = await render(ComboboxFixture, {
    component: 'select',
    disabled: true,
    readonly: true,
  });

  const combobox = screen.getByRole('combobox', { name: 'Fruit' });

  expect(combobox.element().tagName).toBe('DIV');
  await expect.element(combobox).toHaveAttribute('aria-disabled', 'true');
  await expect.element(combobox).toHaveAttribute('aria-readonly', 'true');
  expect(screen.container.querySelector('.sui.combobox')?.classList.contains('select')).toBe(true);
  expect(screen.container.querySelector('.sui.combobox')?.classList.contains('editable')).toBe(
    false,
  );
});

it('selects an option and updates the bound value', async () => {
  const onChange = vi.fn();
  /** @type {ComponentProps<typeof ComboboxFixture>} */
  const props = $state({ component: 'select', value: undefined, onChange });
  const screen = await render(ComboboxFixture, props);

  await screen.getByRole('combobox').click();
  await screen.getByRole('option', { name: 'Cherry' }).click();
  await vi.waitFor(() => {
    expect(props.value).toBe('cherry');
  });
  expect(onChange).toHaveBeenCalledOnce();
  expect(screen.getByRole('combobox').element().textContent).toContain('Cherry');
});
