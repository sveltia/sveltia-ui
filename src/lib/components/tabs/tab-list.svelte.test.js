import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { whenActivated } from '../../test-utils/group.js';
import { text } from '../../test-utils/snippets.js';
import TabListFixture from './tab-list-fixture.test.svelte';
import TabList from './tab-list.svelte';

it('renders a labelled tab list with the state attributes', async () => {
  const screen = await render(TabList, {
    ariaLabel: 'Settings',
    class: 'custom',
    name: 'settings',
    orientation: 'vertical',
    children: text('child'),
  });

  const list = screen.getByRole('tablist', { name: 'Settings' });

  await expect.element(list).toHaveClass('sui', 'tab-list', 'custom');
  await expect.element(list).toHaveAttribute('aria-orientation', 'vertical');
  await expect.element(list).toHaveAttribute('data-name', 'settings');
  expect(list.element().querySelector('.indicator')).not.toBeNull();
});

it('hides and disables the list', async () => {
  const screen = await render(TabList, { hidden: true, disabled: true });
  const list = /** @type {HTMLElement} */ (screen.container.querySelector('[role="tablist"]'));

  expect(list.hidden).toBe(true);
  expect(list.getAttribute('aria-hidden')).toBe('true');
  expect(list.getAttribute('aria-disabled')).toBe('true');
  expect(list.hasAttribute('data-name')).toBe(false);
  expect(list.querySelector('.inner')?.hasAttribute('inert')).toBe(true);
});

it('switches the tabs and panels, and moves the indicator', async () => {
  const onChange = vi.fn();
  const activated = whenActivated();
  const screen = await render(TabListFixture, { onChange });

  await activated;

  const general = screen.getByRole('tab', { name: 'General' });
  const advanced = screen.getByRole('tab', { name: 'Advanced' });
  const generalPanel = /** @type {HTMLElement} */ (document.getElementById('panel-general'));
  const advancedPanel = /** @type {HTMLElement} */ (document.getElementById('panel-advanced'));
  const indicator = /** @type {HTMLElement} */ (screen.container.querySelector('.indicator'));

  await expect.element(general).toHaveAttribute('aria-selected', 'true');
  expect(advancedPanel.inert).toBe(true);
  expect(generalPanel.inert).toBe(false);
  await vi.waitFor(() => {
    expect(indicator.getAttribute('style')).toContain(
      `left: ${/** @type {HTMLElement} */ (general.element()).offsetLeft}px`,
    );
  });

  await advanced.click();
  await expect.element(advanced).toHaveAttribute('aria-selected', 'true');
  await expect.element(general).toHaveAttribute('aria-selected', 'false');
  expect(advancedPanel.inert).toBe(false);
  expect(generalPanel.inert).toBe(true);
  expect(onChange).toHaveBeenCalledOnce();
  expect(onChange.mock.calls[0][0].detail.label).toBe('Advanced');
  await vi.waitFor(() => {
    expect(indicator.getAttribute('style')).toContain(
      `left: ${/** @type {HTMLElement} */ (advanced.element()).offsetLeft}px`,
    );
  });
});
