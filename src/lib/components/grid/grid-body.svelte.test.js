import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { setRTL } from '../../test-utils/locale.js';
import { text } from '../../test-utils/snippets.js';
import GridBody from './grid-body.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

afterEach(() => {
  setRTL(false);
});

it('renders a row group with the children', async () => {
  const screen = await render(GridBody, { class: 'custom', children: text('child') });
  const body = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.grid-body'));

  expect(body.getAttribute('role')).toBe('rowgroup');
  expect(body.getAttribute('aria-roledescription')).toBe('grid body');
  expect(body.classList.contains('custom')).toBe(true);
  expect(body.hasAttribute('aria-labelledby')).toBe(false);
  expect(body.querySelector('.row-group-caption')).toBeNull();
  expect(body.textContent).toContain('child');
});

it('renders a caption row when labelled', async () => {
  const screen = await render(GridBody, { label: 'Recent', children: text('child') });
  const body = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.grid-body'));
  const caption = /** @type {HTMLElement} */ (body.querySelector('.row-group-caption th'));

  expect(caption.getAttribute('role')).toBe('columnheader');
  expect(caption.textContent?.trim()).toBe('Recent');
  expect(caption.querySelector('button')).toBeNull();
  expect(body.getAttribute('aria-labelledby')).toBe(caption.id);

  // A click on the caption is nothing to a static row group
  /** @type {HTMLElement} */ (body.querySelector('.row-group-caption')).click();
  expect(body.textContent).toContain('child');
});

it('renders the caption as an expander when collapsible', async () => {
  const onChange = vi.fn();

  /** @type {ComponentProps<typeof GridBody>} */
  const props = $state({
    label: 'Recent',
    collapsible: true,
    expanded: true,
    onChange,
    children: text('child'),
  });

  const screen = await render(GridBody, props);
  const body = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.grid-body'));
  const caption = /** @type {HTMLElement} */ (body.querySelector('.row-group-caption th'));
  const button = screen.getByRole('button', { name: 'Recent' });

  expect(body.getAttribute('aria-labelledby')).toBe(caption.id);
  expect(caption.contains(button.element())).toBe(true);
  await expect.element(button).toHaveAttribute('aria-expanded', 'true');
  await expect.element(button).toHaveAttribute('tabindex', '-1');
  expect(button.element().querySelector('.icon')?.textContent?.trim()).toBe('chevron_right');
  expect(body.textContent).toContain('child');

  // The button hides the rows
  await button.click();
  await expect.element(button).toHaveAttribute('aria-expanded', 'false');
  expect(body.textContent).not.toContain('child');
  expect(props.expanded).toBe(false);
  expect(onChange).toHaveBeenCalledOnce();
  expect(onChange.mock.calls[0][0].detail).toEqual({ expanded: false });

  // So does the caption row itself, which the grid clicks when Enter is pressed on it
  /** @type {HTMLElement} */ (body.querySelector('.row-group-caption')).click();
  await expect.element(button).toHaveAttribute('aria-expanded', 'true');
  expect(body.textContent).toContain('child');
  expect(onChange).toHaveBeenCalledTimes(2);
  expect(onChange.mock.calls[1][0].detail).toEqual({ expanded: true });
});

it('points the expander chevron the other way in a right-to-left locale', async () => {
  setRTL(true);

  const screen = await render(GridBody, {
    label: 'Recent',
    collapsible: true,
    children: text('child'),
  });

  const button = screen.getByRole('button', { name: 'Recent' });

  expect(button.element().querySelector('.icon')?.textContent?.trim()).toBe('chevron_left');
});

it('starts collapsed and follows the bound prop', async () => {
  /** @type {ComponentProps<typeof GridBody>} */
  const props = $state({
    label: 'Recent',
    collapsible: true,
    expanded: false,
    chevronIcon: text('chevron'),
    children: text('child'),
  });

  const screen = await render(GridBody, props);
  const body = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.grid-body'));
  const button = screen.getByRole('button', { name: 'chevron Recent' });

  await expect.element(button).toHaveAttribute('aria-expanded', 'false');
  expect(body.textContent).not.toContain('child');
  props.expanded = true;
  await expect.element(button).toHaveAttribute('aria-expanded', 'true');
  expect(body.textContent).toContain('child');
});

it('ignores `collapsible` without a label', async () => {
  const screen = await render(GridBody, { collapsible: true, children: text('child') });
  const body = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.grid-body'));

  expect(body.querySelector('.row-group-caption')).toBeNull();
  expect(body.querySelector('button')).toBeNull();
  expect(body.textContent).toContain('child');
});
