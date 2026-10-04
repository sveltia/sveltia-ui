import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { whenActivated } from '../../test-utils/group.js';
import { setRTL } from '../../test-utils/locale.js';
import { getToday, toDateString } from './calendar.js';
import Calendar from './calendar.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

describe('Calendar', () => {
  afterEach(() => {
    setRTL(false);
  });

  it('shows the month of the given date with six weeks of days', async () => {
    const screen = await render(Calendar, { value: '2024-03-15' });
    const days = screen.getByRole('option').all();

    await expect.element(screen.getByRole('button', { name: 'Mar 2024' })).toBeVisible();
    expect(screen.container.querySelectorAll('.weekday')).toHaveLength(7);
    expect(screen.container.querySelector('.weekday')?.textContent?.trim()).toBe('S');
    expect(days).toHaveLength(42);
    // March 2024 starts on a Friday, so the grid starts on Sunday, February 25
    expect(days[0].element().textContent?.trim()).toBe('25');
    expect(days[0].element().parentElement?.classList.contains('other-month')).toBe(true);
    expect(days[5].element().textContent?.trim()).toBe('1');
    expect(days[5].element().parentElement?.classList.contains('other-month')).toBe(false);
    expect(screen.container.querySelector('input[type="hidden"]')?.getAttribute('value')).toBe(
      '2024-03-15',
    );
  });

  it('names the day grid and every day, and exposes the selected day', async () => {
    const screen = await render(Calendar, { value: '2024-03-15' });
    const grid = screen.getByRole('listbox', { name: 'Mar 2024' });
    const day = screen.getByRole('option', { name: 'Friday, March 15, 2024' });

    await expect.element(grid).toBeVisible();
    await expect.element(day).toHaveAttribute('aria-selected', 'true');
    expect(screen.container.querySelectorAll('[role="option"][aria-selected="true"]')).toHaveLength(
      1,
    );
    // The listbox is the single tab stop; the arrow keys move within it
    expect(grid.element().getAttribute('tabindex')).toBe('0');
  });

  it('keeps the keyboard cursor when the arrow keys cross into another month', async () => {
    /** @type {ComponentProps<typeof Calendar>} */
    const props = $state({ value: '2024-03-03' });
    const activated = whenActivated();
    const screen = await render(Calendar, props);

    await activated;

    const listbox = /** @type {HTMLElement} */ (screen.getByRole('listbox').element());
    const march3 = screen.getByRole('option', { name: 'Sunday, March 3, 2024' }).element();

    // The cursor starts on the selected day
    await vi.waitFor(() => {
      expect(march3.classList.contains('focused')).toBe(true);
    });
    expect(listbox.getAttribute('aria-activedescendant')).toBe(march3.id);

    listbox.focus();
    // A week up lands in February, and the grid moves to that month
    await userEvent.keyboard('{ArrowUp}');
    await vi.waitFor(() => {
      expect(props.value).toBe('2024-02-25');
    });
    await expect.element(screen.getByRole('listbox', { name: 'Feb 2024' })).toBeVisible();

    const feb25 = screen.getByRole('option', { name: 'Sunday, February 25, 2024' }).element();

    expect(feb25.classList.contains('focused')).toBe(true);
    expect(feb25.getAttribute('aria-selected')).toBe('true');
    expect(listbox.getAttribute('aria-activedescendant')).toBe(feb25.id);
    // The cursor carries on from there
    await userEvent.keyboard('{ArrowRight}');
    await vi.waitFor(() => {
      expect(props.value).toBe('2024-02-26');
    });
  });

  it('moves the arrow keys by date, past the edges of the grid', async () => {
    /** @type {ComponentProps<typeof Calendar>} */
    const props = $state({ value: '2024-03-01' });
    const activated = whenActivated();
    const screen = await render(Calendar, props);

    await activated;

    const listbox = /** @type {HTMLElement} */ (screen.getByRole('listbox').element());

    listbox.focus();
    // A week before Friday, March 1 is Friday, February 23, which isn’t on March’s grid at all
    await userEvent.keyboard('{ArrowUp}');
    await vi.waitFor(() => {
      expect(props.value).toBe('2024-02-23');
    });
    await expect.element(screen.getByRole('listbox', { name: 'Feb 2024' })).toBeVisible();

    const feb23 = screen.getByRole('option', { name: 'Friday, February 23, 2024' }).element();

    await vi.waitFor(() => {
      expect(feb23.classList.contains('focused')).toBe(true);
    });

    // A week after Sunday, March 31 is Sunday, April 7, rather than the last cell on the grid
    props.value = '2024-03-31';
    await expect.element(screen.getByRole('listbox', { name: 'Mar 2024' })).toBeVisible();
    await userEvent.keyboard('{ArrowDown}');
    await vi.waitFor(() => {
      expect(props.value).toBe('2024-04-07');
    });

    // September 1, 2024 is a Sunday, the first cell on the grid; the day before is still reached
    props.value = '2024-09-01';
    await expect.element(screen.getByRole('listbox', { name: 'Sep 2024' })).toBeVisible();
    await userEvent.keyboard('{ArrowLeft}');
    await vi.waitFor(() => {
      expect(props.value).toBe('2024-08-31');
    });
    await userEvent.keyboard('{ArrowRight}');
    await vi.waitFor(() => {
      expect(props.value).toBe('2024-09-01');
    });
  });

  it('keeps the arrow keys in the month browsed to', async () => {
    /** @type {ComponentProps<typeof Calendar>} */
    const props = $state({ value: '2024-03-15' });
    const activated = whenActivated();
    const screen = await render(Calendar, props);

    await activated;
    await screen.getByRole('button', { name: 'Next Month' }).click();
    await screen.getByRole('button', { name: 'Next Month' }).click();
    await expect.element(screen.getByRole('listbox', { name: 'May 2024' })).toBeVisible();

    /** @type {HTMLElement} */ (screen.getByRole('listbox').element()).focus();
    // The selected day is no longer on the grid, so the cursor starts on the first of May rather
    // than going back to March
    await userEvent.keyboard('{ArrowRight}');
    await vi.waitFor(() => {
      expect(props.value).toBe('2024-05-01');
    });
    await expect.element(screen.getByRole('listbox', { name: 'May 2024' })).toBeVisible();
    await userEvent.keyboard('{ArrowRight}');
    await vi.waitFor(() => {
      expect(props.value).toBe('2024-05-02');
    });
  });

  it('starts the arrow keys on today without a selected day', async () => {
    /** @type {ComponentProps<typeof Calendar>} */
    const props = $state({ value: undefined });
    const activated = whenActivated();
    const screen = await render(Calendar, props);

    await activated;
    /** @type {HTMLElement} */ (screen.getByRole('listbox').element()).focus();
    await userEvent.keyboard('{ArrowDown}');
    await vi.waitFor(() => {
      expect(props.value).toBe(toDateString(getToday()));
    });

    // An arrow key with a modifier is left alone
    const { value } = props;

    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
    expect(props.value).toBe(value);
  });

  it('mirrors the inline arrow keys in a right-to-left locale', async () => {
    setRTL(true);

    /** @type {ComponentProps<typeof Calendar>} */
    const props = $state({ value: '2024-03-15' });
    const activated = whenActivated();
    const screen = await render(Calendar, props);

    await activated;
    /** @type {HTMLElement} */ (screen.getByRole('listbox').element()).focus();
    await userEvent.keyboard('{ArrowLeft}');
    await vi.waitFor(() => {
      expect(props.value).toBe('2024-03-16');
    });
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await vi.waitFor(() => {
      expect(props.value).toBe('2024-03-14');
    });
  });

  it('moves the keyboard cursor to a value set from outside', async () => {
    /** @type {ComponentProps<typeof Calendar>} */
    const props = $state({ value: '2024-03-03' });
    const activated = whenActivated();
    const screen = await render(Calendar, props);

    await activated;

    const listbox = /** @type {HTMLElement} */ (screen.getByRole('listbox').element());
    const march3 = screen.getByRole('option', { name: 'Sunday, March 3, 2024' }).element();

    await vi.waitFor(() => {
      expect(march3.classList.contains('focused')).toBe(true);
    });

    // February’s grid still shows March 3 as a trailing day, so its cell survives the change
    props.value = '2024-02-27';
    await expect.element(screen.getByRole('listbox', { name: 'Feb 2024' })).toBeVisible();

    const feb27 = screen.getByRole('option', { name: 'Tuesday, February 27, 2024' }).element();

    await vi.waitFor(() => {
      expect(feb27.classList.contains('focused')).toBe(true);
    });
    expect(march3.isConnected).toBe(true);
    expect(march3.classList.contains('focused')).toBe(false);
    expect(listbox.getAttribute('aria-activedescendant')).toBe(feb27.id);
  });

  it('shows the current month by default and marks today', async () => {
    const screen = await render(Calendar);
    const now = new Date();
    const label = now.toLocaleDateString('en', { year: 'numeric', month: 'short' });

    await expect.element(screen.getByRole('button', { name: label })).toBeVisible();

    const today = /** @type {HTMLElement} */ (screen.container.querySelector('.today'));

    expect(today.textContent?.trim()).toBe(String(now.getDate()));
  });

  it('selects a day when clicked', async () => {
    /** @type {ComponentProps<typeof Calendar>} */
    const props = $state({ value: '2024-03-15' });
    const screen = await render(Calendar, props);

    await screen.getByRole('option').nth(5).click();
    expect(props.value).toBe('2024-03-01');
  });

  it('navigates to the previous and next months', async () => {
    const screen = await render(Calendar, { value: '2024-03-15' });

    await screen.getByRole('button', { name: 'Previous Month' }).click();
    await expect.element(screen.getByRole('button', { name: 'Feb 2024' })).toBeVisible();
    // February 2024 starts on a Thursday
    expect(screen.getByRole('option').nth(4).element().textContent?.trim()).toBe('1');
    await screen.getByRole('button', { name: 'Next Month' }).click();
    await screen.getByRole('button', { name: 'Next Month' }).click();
    await expect.element(screen.getByRole('button', { name: 'Apr 2024' })).toBeVisible();
  });

  it('clears the value and jumps to today', async () => {
    /** @type {ComponentProps<typeof Calendar>} */
    const props = $state({ value: '2024-03-15' });
    const screen = await render(Calendar, props);

    await screen.getByRole('button', { name: 'Clear' }).click();
    expect(props.value).toBe('');
    await screen.getByRole('button', { name: 'Today' }).click();

    const now = new Date();

    // Today’s local date, not the UTC one, which may be a day off
    expect(props.value).toBe(
      [now.getFullYear(), now.getMonth() + 1, now.getDate()]
        .map((n) => String(n).padStart(2, '0'))
        .join('-'),
    );
  });

  it('opens the year and month picker from the header', async () => {
    const screen = await render(Calendar, { value: '2024-03-15' });

    await screen.getByRole('button', { name: 'Mar 2024' }).click();
    await vi.waitFor(() => {
      expect(document.querySelector('dialog.popup .popup-inner')?.checkVisibility()).toBe(true);
    });

    const popup = /** @type {HTMLElement} */ (document.querySelector('dialog.popup .popup-inner'));

    expect(popup.querySelector('[role="group"][aria-label="Year"]')).not.toBeNull();
    expect(popup.querySelector('[role="group"][aria-label="Month"]')).not.toBeNull();
    expect(popup.querySelector('[aria-label="Previous Decade"]')).not.toBeNull();
    expect(popup.querySelector('[aria-label="Next Decade"]')).not.toBeNull();
    expect(popup.querySelectorAll('[aria-label="Month"] button')).toHaveLength(12);
    expect(popup.querySelector('[aria-label="Month"] button')?.textContent?.trim()).toBe('Jan');

    // A click within the picker doesn’t close it. The decade buttons don’t do anything yet.
    /** @type {HTMLElement} */ (popup.querySelector('[aria-label="Previous Decade"]')).click();
    /** @type {HTMLElement} */ (popup.querySelector('[aria-label="Next Decade"]')).click();
    /** @type {HTMLElement} */ (popup.querySelector('[aria-label="Month"] button')).click();
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(popup.isConnected).toBe(true);
  });

  it('mirrors the chevrons in a right-to-left locale', async () => {
    setRTL(true);

    const screen = await render(Calendar, { value: '2024-03-15' });
    // The labels are localized, so find the buttons by their place in the header
    const [monthPicker, previous, next] = screen.container.querySelectorAll('.header > button');

    expect(previous.querySelector('.icon')?.textContent?.trim()).toBe('chevron_right');
    expect(next.querySelector('.icon')?.textContent?.trim()).toBe('chevron_left');
    /** @type {HTMLElement} */ (monthPicker).click();
    await vi.waitFor(() => {
      const [previousDecade, nextDecade] = document.querySelectorAll('dialog.popup .header button');

      expect(previousDecade?.querySelector('.icon')?.textContent?.trim()).toBe('chevron_right');
      expect(nextDecade?.querySelector('.icon')?.textContent?.trim()).toBe('chevron_left');
    });
  });
});
