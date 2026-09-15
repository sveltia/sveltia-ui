import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import ComboboxFixture from './combobox-fixture.test.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * Get the listbox rendered in the popup.
 * @returns {HTMLElement | null} Element.
 */
const getListbox = () => document.querySelector('dialog.popup [role="listbox"]');

/**
 * Wait for the dropdown to be expanded, with its options rendered.
 * @param {number} count Number of options expected.
 */
const waitForOptions = async (count) => {
  await vi.waitFor(() => {
    expect(getListbox()?.querySelectorAll('[role="option"]')).toHaveLength(count);
  });
};

describe('Combobox', () => {
  it('renders a combobox with the state attributes', async () => {
    const screen = await render(ComboboxFixture, {
      editable: false,
      disabled: true,
      readonly: true,
    });

    const combobox = screen.getByRole('combobox', { name: 'Fruit' });

    await expect.element(combobox).toHaveAttribute('aria-expanded', 'false');
    await expect.element(combobox).toHaveAttribute('aria-haspopup', 'listbox');
    await expect.element(combobox).toHaveAttribute('aria-disabled', 'true');
    await expect.element(combobox).toHaveAttribute('aria-readonly', 'true');
    await expect.element(combobox).toHaveAttribute('tabindex', '-1');
    expect(combobox.element().textContent).toContain('Select an option…');
    // The options are not rendered while collapsed
    expect(screen.container.querySelector('[role="option"]')).toBeNull();
    expect(screen.container.querySelector('.idle-host [role="listbox"]')).not.toBeNull();
  });

  it('opens the dropdown and selects an option', async () => {
    const onChange = vi.fn();
    /** @type {ComponentProps<typeof ComboboxFixture>} */
    const props = $state({ editable: false, value: undefined, onChange });
    const screen = await render(ComboboxFixture, props);
    const combobox = screen.getByRole('combobox', { name: 'Fruit' });

    await combobox.click();
    await expect.element(combobox).toHaveAttribute('aria-expanded', 'true');
    await waitForOptions(3);
    expect(combobox.element().getAttribute('aria-controls')).toBe(
      getListbox()?.closest('.content')?.id,
    );
    // A short list has no filter
    expect(document.querySelector('dialog.popup .search-bar')).toBeNull();

    await screen.getByRole('option', { name: 'Banana' }).click();
    await vi.waitFor(() => {
      expect(props.value).toBe('banana');
    });
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].detail.value).toBe('banana');
    expect(onChange.mock.calls[0][0].detail.label).toBe('Banana');
    await expect.element(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(combobox.element().textContent).toContain('Banana');
    expect(combobox.element().classList.contains('selected')).toBe(true);
    await vi.waitFor(() => {
      expect(getListbox()).toBeNull();
    });
  });

  it('resolves the label of a value set from outside', async () => {
    /** @type {ComponentProps<typeof ComboboxFixture>} */
    const props = $state({ editable: false, value: 'cherry' });
    const screen = await render(ComboboxFixture, props);
    const combobox = screen.getByRole('combobox');

    await vi.waitFor(() => {
      expect(combobox.element().textContent).toContain('Cherry');
    });
    props.value = 'apple';
    await vi.waitFor(() => {
      expect(combobox.element().textContent).toContain('Apple');
    });
  });

  it('takes the initial value from the option marked as selected', async () => {
    const onChange = vi.fn();

    /** @type {ComponentProps<typeof ComboboxFixture>} */
    const props = $state({
      editable: false,
      value: undefined,
      initiallySelected: 'Banana',
      onChange,
    });

    const screen = await render(ComboboxFixture, props);

    await vi.waitFor(() => {
      expect(props.value).toBe('banana');
    });
    expect(screen.getByRole('combobox').element().textContent).toContain('Banana');
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].detail).toEqual({
      target: undefined,
      type: 'string',
      name: undefined,
      label: 'Banana',
      value: 'banana',
    });
  });

  it('reveals the selected option when expanded', async () => {
    /** @type {ComponentProps<typeof ComboboxFixture>} */
    const props = $state({ editable: false, value: 'cherry' });
    const screen = await render(ComboboxFixture, props);

    await screen.getByRole('combobox').click();
    await waitForOptions(3);
    await vi.waitFor(() => {
      const listbox = /** @type {HTMLElement} */ (getListbox());
      const cherry = screen.getByRole('option', { name: 'Cherry' }).element();

      expect(cherry.getAttribute('aria-selected')).toBe('true');
      expect(cherry.classList.contains('focused')).toBe(true);
      expect(listbox.getAttribute('aria-activedescendant')).toBe(cherry.id);
    });
  });

  it('keeps the expand button out of the way in the non-editable mode', async () => {
    const screen = await render(ComboboxFixture, { editable: false });
    const toggle = screen.getByRole('button', { name: 'Expand' });

    // The combobox itself is the anchor, so the button is neither focusable nor clickable
    await expect.element(toggle).toHaveAttribute('tabindex', '-1');
    expect(getComputedStyle(toggle.element()).pointerEvents).toBe('none');
  });

  it('has nothing to reveal when no option is selected', async () => {
    const screen = await render(ComboboxFixture, { editable: false });

    await screen.getByRole('combobox').click();
    await waitForOptions(3);
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
    expect(getListbox()?.hasAttribute('aria-activedescendant')).toBe(false);
    expect(getListbox()?.querySelector('.focused')).toBeNull();
    // A click on the list itself, outside any option, selects nothing
    /** @type {HTMLElement} */ (getListbox()).click();
    await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
  });

  it('toggles the dropdown with the expand button in the editable mode', async () => {
    const screen = await render(ComboboxFixture, { editable: true });
    const input = screen.getByRole('combobox');
    const toggle = screen.getByRole('button', { name: 'Expand' });

    await expect.element(toggle).toHaveAttribute('tabindex', '0');
    await toggle.click();
    await expect.element(input).toHaveAttribute('aria-expanded', 'true');
    await expect.element(screen.getByRole('button', { name: 'Collapse' })).toBeVisible();
    await waitForOptions(3);
    expect(
      screen.getByRole('button', { name: 'Collapse' }).element().getAttribute('aria-controls'),
    ).toBe(getListbox()?.closest('dialog')?.id);

    // Clicking outside closes the dropdown
    /** @type {HTMLElement} */ (document.querySelector('dialog.popup')).click();
    await expect.element(input).toHaveAttribute('aria-expanded', 'false');
    await vi.waitFor(() => {
      expect(getListbox()).toBeNull();
    });
  });

  it('renders an editable text input in the editable mode', async () => {
    /** @type {ComponentProps<typeof ComboboxFixture>} */
    const props = $state({ editable: true, value: 'apple' });
    const screen = await render(ComboboxFixture, props);
    const input = screen.getByRole('combobox', { name: 'Fruit' });

    expect(input.element().tagName).toBe('INPUT');
    await expect.element(input).toHaveValue('apple');
    await expect.element(input).toHaveAttribute('aria-haspopup', 'listbox');
    await expect
      .element(screen.getByRole('button', { name: 'Expand' }))
      .toHaveAttribute('tabindex', '0');
    expect(screen.container.querySelector('.sui.combobox')?.classList.contains('editable')).toBe(
      true,
    );

    await screen.getByRole('button', { name: 'Expand' }).click();
    await waitForOptions(3);
    await screen.getByRole('option', { name: 'Cherry' }).click();
    await vi.waitFor(() => {
      expect(props.value).toBe('cherry');
    });
    await expect.element(input).toHaveValue('cherry');
  });

  it('shows a filter for a long list and reports when nothing matches', async () => {
    const screen = await render(ComboboxFixture, { editable: false, count: 7 });

    await screen.getByRole('combobox').click();
    await waitForOptions(7);

    const filter = screen.getByRole('searchbox', { name: 'Filter Options' });

    await expect.element(filter).toBeVisible();
    expect(filter.element().getAttribute('aria-controls')).toBe(getListbox()?.id);
    await filter.fill('an');
    await vi.waitFor(() => {
      const visible = [...(getListbox()?.querySelectorAll('[role="option"]') ?? [])].filter(
        (option) => !(/** @type {HTMLElement} */ (option).hidden),
      );

      expect(visible.map((option) => option.getAttribute('data-label'))).toEqual(['Banana']);
    });
    expect(document.querySelector('dialog.popup .no-options')).toBeNull();

    await filter.fill('zzz');
    await vi.waitFor(() => {
      expect(document.querySelector('dialog.popup .no-options')?.textContent).toContain(
        'No matching options found',
      );
    });

    // The arrow keys and Enter go through to the listbox
    await filter.fill('');
    await vi.waitFor(() => {
      expect(document.querySelector('dialog.popup .no-options')).toBeNull();
      expect(getListbox()?.querySelectorAll('[role="option"][aria-hidden="false"]')).toHaveLength(
        7,
      );
    });
    // The listbox picks its members up again asynchronously, so keep pressing until it does
    await vi.waitFor(async () => {
      await userEvent.keyboard('{ArrowDown}');
      expect(getListbox()?.querySelector('[role="option"].focused')).not.toBeNull();
    });
  });

  it('hides the filter when the threshold is disabled', async () => {
    const screen = await render(ComboboxFixture, {
      editable: false,
      count: 7,
      filterThreshold: -1,
    });

    await screen.getByRole('combobox').click();
    await waitForOptions(7);
    expect(document.querySelector('dialog.popup .search-bar')).toBeNull();
  });

  it('opens the dropdown with the arrow keys', async () => {
    const screen = await render(ComboboxFixture, { editable: false });
    const combobox = screen.getByRole('combobox', { name: 'Fruit' });

    /** @type {HTMLElement} */ (combobox.element()).focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect.element(combobox).toHaveAttribute('aria-expanded', 'true');
    await waitForOptions(3);
    await userEvent.keyboard('{Escape}');
    await expect.element(combobox).toHaveAttribute('aria-expanded', 'false');
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(combobox.element());
    });
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await expect.element(combobox).toHaveAttribute('aria-expanded', 'true');
  });

  it('picks an option by its first letters while collapsed', async () => {
    const onChange = vi.fn();
    /** @type {ComponentProps<typeof ComboboxFixture>} */
    const props = $state({ editable: false, value: undefined, count: 7, onChange });
    const screen = await render(ComboboxFixture, props);
    const combobox = screen.getByRole('combobox', { name: 'Fruit' });

    /** @type {HTMLElement} */ (combobox.element()).focus();
    await userEvent.keyboard('c');
    await vi.waitFor(() => {
      expect(props.value).toBe('cherry');
    });
    expect(combobox.element().textContent).toContain('Cherry');
    expect(combobox.element().getAttribute('aria-expanded')).toBe('false');
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].detail).toMatchObject({ value: 'cherry', label: 'Cherry' });

    // Quick successive keys make up one prefix, so let the previous one expire first; a match on
    // the current option is not a change
    await new Promise((resolve) => {
      setTimeout(resolve, 600);
    });
    await userEvent.keyboard('gr');
    await vi.waitFor(() => {
      expect(props.value).toBe('grape');
    });
    await userEvent.keyboard('gr');
    expect(onChange).toHaveBeenCalledTimes(2);

    // A key that matches nothing is still swallowed, so the browser doesn’t start searching the
    // page (Firefox find-as-you-type)
    const miss = new KeyboardEvent('keydown', { key: 'z', bubbles: true, cancelable: true });

    combobox.element().dispatchEvent(miss);
    expect(miss.defaultPrevented).toBe(true);
    expect(props.value).toBe('grape');
  });

  it('does not open while disabled or read-only', async () => {
    /** @type {ComponentProps<typeof ComboboxFixture>} */
    const props = $state({ editable: false, disabled: true });
    const screen = await render(ComboboxFixture, props);

    const combobox = /** @type {HTMLElement} */ (
      screen.container.querySelector('[role="combobox"]')
    );

    const toggle = /** @type {HTMLButtonElement} */ (screen.container.querySelector('.sui.button'));

    combobox.click();
    toggle.click();
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(combobox.getAttribute('aria-expanded')).toBe('false');

    props.disabled = false;
    props.readonly = true;
    await vi.waitFor(() => {
      expect(combobox.getAttribute('aria-readonly')).toBe('true');
    });
    combobox.click();
    toggle.click();
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(combobox.getAttribute('aria-expanded')).toBe('false');
  });
});
