import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Calendar from './calendar.svelte';
import { setRTL } from '../../test-utils/locale.js';

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
    expect(props.value).toBe(new Date().toJSON().split('T')[0]);
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
    const [monthPicker, , next] = screen.container.querySelectorAll('.header > button');

    expect(next.querySelector('.icon')?.textContent?.trim()).toBe('chevron_left');
    /** @type {HTMLElement} */ (monthPicker).click();
    await vi.waitFor(() => {
      const [, nextDecade] = document.querySelectorAll('dialog.popup .header button');

      expect(nextDecade?.querySelector('.icon')?.textContent?.trim()).toBe('chevron_left');
    });
  });
});
