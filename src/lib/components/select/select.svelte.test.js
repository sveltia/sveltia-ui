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

it('shows the label above a select, and focuses it on a click', async () => {
  const screen = await render(ComboboxFixture, { component: 'select', showLabelAbove: true });
  const label = screen.getByText('Fruit', { exact: true });
  const combobox = screen.getByRole('combobox', { name: 'Fruit' });
  const button = /** @type {HTMLElement} */ (screen.container.querySelector('.combobox > button'));

  expect(label.element().tagName).toBe('LABEL');
  // A `<div>` can’t be the target of a label
  expect(label.element().hasAttribute('for')).toBe(false);
  expect(label.element().getBoundingClientRect().bottom).toBeLessThanOrEqual(
    combobox.element().getBoundingClientRect().top,
  );
  // The button stays on the field, not on the label
  expect(button.getBoundingClientRect().bottom).toBeCloseTo(
    combobox.element().getBoundingClientRect().bottom,
    0,
  );

  await label.click();
  await expect.element(combobox).toHaveFocus();
  await expect.element(combobox).toHaveAttribute('aria-expanded', 'false');
});

it('doesn’t focus a disabled select from its label', async () => {
  const screen = await render(ComboboxFixture, {
    component: 'select',
    showLabelAbove: true,
    disabled: true,
  });

  await screen.getByText('Fruit', { exact: true }).click();
  await expect.element(screen.getByRole('combobox')).not.toHaveFocus();
});

it('points the label above an editable combobox at its input', async () => {
  const screen = await render(ComboboxFixture, { showLabelAbove: true });
  const label = screen.getByText('Fruit', { exact: true });
  const input = screen.getByRole('combobox', { name: 'Fruit' });

  expect(label.element().getAttribute('for')).toBe(input.element().id);
  // Rendered once, by the combobox rather than by its text input as well
  expect(screen.container.querySelectorAll('label')).toHaveLength(1);
  await label.click();
  await expect.element(input).toHaveFocus();
});

it('shows no label above without the option', async () => {
  const screen = await render(ComboboxFixture, { component: 'select' });

  expect(screen.container.querySelector('label')).toBeNull();
});

it('takes its name from a plain `aria-label` attribute as well', async () => {
  const screen = await render(ComboboxFixture, {
    component: 'select',
    // An empty prop doesn’t hide the attribute
    ariaLabel: '',
    'aria-label': 'Role',
    showLabelAbove: true,
  });

  await expect.element(screen.getByRole('combobox', { name: 'Role' })).toBeVisible();
  expect(screen.getByText('Role', { exact: true }).element().tagName).toBe('LABEL');
});
