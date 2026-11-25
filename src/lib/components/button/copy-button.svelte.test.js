import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import CopyButton from './copy-button.svelte';

/**
 * Get the tooltip of the rendered button, which is only rendered once the button is hovered or
 * focused, or the tooltip is forced open.
 * @param {HTMLElement} container Container.
 * @returns {HTMLElement | null} Tooltip.
 */
const getTooltip = (container) => container.querySelector('[role="tooltip"]');
/**
 * Check whether the tooltip of the rendered button is shown.
 * @param {HTMLElement} container Container.
 * @returns {boolean} Result.
 */
const isTooltipShown = (container) => !!getTooltip(container)?.matches(':popover-open');

describe('CopyButton', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('copies the text, then says so in its tooltip for a moment', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const onCopy = vi.fn();

    const screen = await render(CopyButton, {
      text: 'secret',
      ariaLabel: 'Copy the password',
      onCopy,
    });

    const button = screen.getByRole('button', { name: 'Copy the password' });
    const status = screen.getByRole('status');

    // The tooltip isn’t rendered until the button is used, and it shows the label, which it
    // doesn’t repeat as a description
    expect(getTooltip(screen.container)).toBeNull();
    expect(button.element().hasAttribute('aria-describedby')).toBe(false);
    await expect.element(status).toHaveTextContent('');
    await button.click();

    expect(writeText).toHaveBeenCalledWith('secret');
    expect(onCopy).toHaveBeenCalledOnce();
    expect(onCopy.mock.calls[0][0].detail).toEqual({ text: 'secret' });
    await expect.poll(() => isTooltipShown(screen.container)).toBe(true);

    const tooltip = /** @type {HTMLElement} */ (getTooltip(screen.container));

    expect(tooltip.textContent?.trim()).toBe('Copied');
    await expect.element(status).toHaveTextContent('Copied');
    expect(button.element().querySelector('.icon')?.textContent).toBe('check');
    // The button stays an icon, rather than growing a label
    expect(button.element().classList.contains('iconic')).toBe(true);
    expect(button.element().querySelector('.label')).toBeNull();

    // Back to the icon once the moment has passed
    await expect
      .poll(() => button.element().querySelector('.icon')?.textContent, { timeout: 4000 })
      .toBe('content_copy');
    await expect.element(status).toHaveTextContent('');
    expect(tooltip.textContent?.trim()).toBe('Copy the password');
  });

  it('has a default label', async () => {
    const screen = await render(CopyButton, { text: 'secret' });
    const button = screen.getByRole('button', { name: 'Copy' });

    await expect.element(button).toBeVisible();
    await userEvent.hover(button);
    await expect.poll(() => isTooltipShown(screen.container)).toBe(true);
    expect(getTooltip(screen.container)?.textContent?.trim()).toBe('Copy');
  });

  it('reports a refused copy and stays as it was', async () => {
    const error = new Error('Denied');
    const onError = vi.fn();

    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(error);

    const screen = await render(CopyButton, { text: 'secret', onError });
    const button = screen.getByRole('button', { name: 'Copy' });

    await button.click();
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce());
    expect(onError.mock.calls[0][0].detail).toEqual({ error });
    expect(button.element().querySelector('.icon')?.textContent).toBe('content_copy');
    await expect.element(screen.getByRole('status')).toHaveTextContent('');
  });

  it('works without callbacks', async () => {
    vi.spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue()
      .mockRejectedValueOnce(new Error('Denied'));

    const screen = await render(CopyButton, { text: 'secret' });
    const button = screen.getByRole('button', { name: 'Copy' });

    await button.click();
    expect(button.element().querySelector('.icon')?.textContent).toBe('content_copy');
    await button.click();
    await expect.poll(() => button.element().querySelector('.icon')?.textContent).toBe('check');
  });

  it('leaves the Escape key alone while saying the text has been copied', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();

    const screen = await render(CopyButton, { text: 'secret' });
    /** @type {string[]} */
    const reached = [];

    /**
     * Record the key presses that reach the document.
     * @param {KeyboardEvent} event `keydown` event.
     */
    const listener = (event) => {
      reached.push(event.key);
    };

    document.addEventListener('keydown', listener);
    await screen.getByRole('button').click();
    await expect.poll(() => isTooltipShown(screen.container)).toBe(true);
    await userEvent.keyboard('{Escape}');
    expect(reached).toContain('Escape');
    expect(isTooltipShown(screen.container)).toBe(true);
    document.removeEventListener('keydown', listener);
  });
});
