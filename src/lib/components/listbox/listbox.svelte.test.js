import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { whenActivated } from '../../test-utils/group.js';
import { text } from '../../test-utils/snippets.js';
import ListboxFixture from './listbox-fixture.test.svelte';
import Listbox from './listbox.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

describe('Listbox', () => {
  it('renders a focusable listbox with the state attributes', async () => {
    const screen = await render(Listbox, {
      ariaLabel: 'Fruits',
      class: 'custom',
      multiple: true,
      readonly: true,
      required: true,
      invalid: true,
      children: text('child'),
    });

    const listbox = screen.getByRole('listbox', { name: 'Fruits' });

    await expect.element(listbox).toHaveClass('sui', 'listbox', 'custom');
    await expect.element(listbox).toHaveAttribute('tabindex', '0');
    await expect.element(listbox).toHaveAttribute('aria-multiselectable', 'true');
    await expect.element(listbox).toHaveAttribute('aria-readonly', 'true');
    await expect.element(listbox).toHaveAttribute('aria-required', 'true');
    await expect.element(listbox).toHaveAttribute('aria-invalid', 'true');
    expect(listbox.element().textContent).toContain('child');
  });

  it('hides and disables the listbox', async () => {
    const screen = await render(Listbox, { hidden: true, disabled: true });
    const listbox = /** @type {HTMLElement} */ (screen.container.querySelector('[role="listbox"]'));

    expect(listbox.hidden).toBe(true);
    expect(listbox.getAttribute('aria-hidden')).toBe('true');
    expect(listbox.getAttribute('aria-disabled')).toBe('true');
    expect(listbox.querySelector('.inner')?.hasAttribute('inert')).toBe(true);
  });

  it('selects an option when clicked', async () => {
    const onChange = vi.fn();
    const onOptionChange = vi.fn();
    const activated = whenActivated();
    const screen = await render(ListboxFixture, { onChange, onOptionChange });

    await activated;

    const apple = screen.getByRole('option', { name: 'Apple' });
    const banana = screen.getByRole('option', { name: 'Banana' });

    await expect.element(banana).toHaveAttribute('aria-selected', 'true');
    await expect.element(apple).toHaveAttribute('aria-selected', 'false');
    await apple.click();
    await expect.element(apple).toHaveAttribute('aria-selected', 'true');
    await expect.element(banana).toHaveAttribute('aria-selected', 'false');
    expect(apple.element().querySelector('.icon.check')).not.toBeNull();
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].detail.value).toBe('apple');
    expect(onOptionChange).toHaveBeenCalledOnce();
    expect(onOptionChange.mock.calls[0][0].detail).toEqual({ selected: true });
    expect(screen.getByRole('listbox').element().getAttribute('aria-activedescendant')).toBe(
      apple.element().id,
    );
  });

  it('keeps the focus on the listbox after a click', async () => {
    const activated = whenActivated();
    const screen = await render(ListboxFixture);

    await activated;

    const listbox = screen.getByRole('listbox');
    const apple = screen.getByRole('option', { name: 'Apple' });
    const banana = screen.getByRole('option', { name: 'Banana' });

    // The option button takes the focus when clicked, and the listbox has to take it back so the
    // arrow keys carry on from the clicked option, and the focus ring follows them
    await apple.click();
    expect(document.activeElement).toBe(listbox.element());
    expect(apple.element().classList.contains('focused')).toBe(true);
    await userEvent.keyboard('{ArrowDown}');
    await expect.element(banana).toHaveAttribute('aria-selected', 'true');
    expect(banana.element().classList.contains('focused')).toBe(true);
    expect(apple.element().classList.contains('focused')).toBe(false);
  });

  it('toggles options when multiple', async () => {
    const activated = whenActivated();
    const screen = await render(ListboxFixture, { multiple: true });

    await activated;

    const apple = screen.getByRole('option', { name: 'Apple' });
    const banana = screen.getByRole('option', { name: 'Banana' });

    await apple.click();
    await expect.element(apple).toHaveAttribute('aria-selected', 'true');
    await expect.element(banana).toHaveAttribute('aria-selected', 'true');
    await apple.click();
    await expect.element(apple).toHaveAttribute('aria-selected', 'false');
  });

  it('moves the selection with the arrow keys, skipping disabled options', async () => {
    const activated = whenActivated();
    const screen = await render(ListboxFixture);

    await activated;

    const listbox = screen.getByRole('listbox');
    const apple = screen.getByRole('option', { name: 'Apple' });
    const lemon = screen.getByRole('option', { name: 'Lemon' });

    /** @type {HTMLElement} */ (listbox.element()).focus();
    // Nothing has been focused yet, so the first option is the starting point
    await userEvent.keyboard('{ArrowDown}');
    await expect.element(apple).toHaveAttribute('aria-selected', 'true');
    expect(apple.element().classList.contains('focused')).toBe(true);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await expect.element(lemon).toHaveAttribute('aria-selected', 'true');
    // Orange is disabled, so the selection wraps around to the first option
    await userEvent.keyboard('{ArrowDown}');
    await expect.element(apple).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowUp}');
    await expect.element(lemon).toHaveAttribute('aria-selected', 'true');
  });

  it('jumps to either end with Home and End', async () => {
    const activated = whenActivated();
    const screen = await render(ListboxFixture);

    await activated;

    const listbox = screen.getByRole('listbox');
    const apple = screen.getByRole('option', { name: 'Apple' });
    const lemon = screen.getByRole('option', { name: 'Lemon' });

    /** @type {HTMLElement} */ (listbox.element()).focus();
    await userEvent.keyboard('{End}');
    // Orange is disabled, so Lemon is the last active option
    await expect.element(lemon).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{Home}');
    await expect.element(apple).toHaveAttribute('aria-selected', 'true');
  });

  it('moves to the option whose label starts with the typed characters', async () => {
    const activated = whenActivated();
    const screen = await render(ListboxFixture);

    await activated;

    const listbox = screen.getByRole('listbox');
    const apple = screen.getByRole('option', { name: 'Apple' });
    const banana = screen.getByRole('option', { name: 'Banana' });
    const lemon = screen.getByRole('option', { name: 'Lemon' });

    /**
     * Quick successive keys make up one prefix, so let each one expire before the next.
     * @returns {Promise<void>} Resolves once the prefix has expired.
     */
    const pause = () =>
      new Promise((resolve) => {
        setTimeout(resolve, 600);
      });

    /** @type {HTMLElement} */ (listbox.element()).focus();
    await userEvent.keyboard('l');
    await expect.element(lemon).toHaveAttribute('aria-selected', 'true');
    await pause();
    await userEvent.keyboard('a');
    await expect.element(apple).toHaveAttribute('aria-selected', 'true');
    await pause();
    await userEvent.keyboard('ba');
    await expect.element(banana).toHaveAttribute('aria-selected', 'true');

    // Nothing starts with this, so nothing moves — but the key is still swallowed, so the browser
    // doesn’t start searching the page (Firefox find-as-you-type)
    const miss = new KeyboardEvent('keydown', { key: 'z', bubbles: true, cancelable: true });

    listbox.element().dispatchEvent(miss);
    expect(miss.defaultPrevented).toBe(true);
    await expect.element(banana).toHaveAttribute('aria-selected', 'true');
  });

  it('filters the options with the search terms', async () => {
    const onFilter = vi.fn();
    /** @type {ComponentProps<typeof ListboxFixture>} */
    const props = $state({ searchTerms: '', onFilter });
    const activated = whenActivated();
    const screen = await render(ListboxFixture, props);

    await activated;

    const listbox = /** @type {HTMLElement} */ (screen.container.querySelector('[role="listbox"]'));

    props.searchTerms = 'an';
    await vi.waitFor(() => {
      expect(listbox.classList.contains('filtered')).toBe(true);
    });

    const visible = screen
      .getByRole('option')
      .all()
      .filter((option) => !(/** @type {HTMLElement} */ (option.element()).hidden))
      .map((option) => option.element().getAttribute('data-label'));

    expect(visible).toEqual(['Banana', 'Orange']);
    expect(onFilter).toHaveBeenCalled();
    expect(onFilter.mock.lastCall?.[0].detail).toEqual({ matched: 2, total: 4 });

    // The custom search value is matched instead of the label
    props.searchTerms = 'sour';
    await vi.waitFor(() => {
      expect(onFilter.mock.lastCall?.[0].detail).toEqual({ matched: 1, total: 4 });
    });
    expect(
      /** @type {HTMLElement} */ (screen.getByRole('option', { name: 'Lemon' }).element()).hidden,
    ).toBe(false);

    props.searchTerms = '';
    await vi.waitFor(() => {
      expect(listbox.classList.contains('filtered')).toBe(false);
    });
  });
});
