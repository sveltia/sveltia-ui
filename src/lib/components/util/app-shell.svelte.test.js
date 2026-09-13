import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import AppShell from './app-shell.svelte';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.autoTheming;
  delete document.documentElement.dataset.env;
});

it('renders the shell with the orientation class and children', async () => {
  const screen = await render(AppShell, { orientation: 'vertical', children: text('App') });
  const shell = screen.container.querySelector('.sui.app-shell');

  expect(shell?.classList.contains('vertical')).toBe(true);
  expect(shell?.textContent).toContain('App');
});

it('applies the theme matching the color scheme preference', async () => {
  const matchMedia = vi.spyOn(window, 'matchMedia');

  matchMedia.mockImplementation(
    (query) =>
      /** @type {MediaQueryList} */ (
        /** @type {unknown} */ ({
          matches: query.includes('dark'),
          media: query,
          /**
           * Ignore listeners.
           */
          addEventListener: () => {},
          /**
           * Ignore listeners.
           */
          removeEventListener: () => {},
        })
      ),
  );

  await render(AppShell);
  expect(document.documentElement.dataset.theme).toBe('dark');
  matchMedia.mockRestore();
});

it('leaves the theme alone when auto theming is disabled', async () => {
  document.documentElement.dataset.autoTheming = 'false';
  document.documentElement.dataset.theme = 'custom';
  await render(AppShell);
  expect(document.documentElement.dataset.theme).toBe('custom');
});

it('shows the font loader for a second', async () => {
  const screen = await render(AppShell);

  expect(screen.container.querySelector('.font-loader')).not.toBeNull();
  await vi.advanceTimersByTimeAsync(1000);
  expect(screen.container.querySelector('.font-loader')).toBeNull();
});

it('suppresses the context menu except on text fields', async () => {
  const screen = await render(AppShell, {
    children: text('App'),
  });

  const shell = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.app-shell'));
  const input = document.createElement('input');

  shell.appendChild(input);

  const onShell = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
  const onInput = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });

  shell.dispatchEvent(onShell);
  input.dispatchEvent(onInput);
  expect(onShell.defaultPrevented).toBe(true);
  expect(onInput.defaultPrevented).toBe(false);
});

it('prevents the browser from opening dropped files', async () => {
  const screen = await render(AppShell);
  const shell = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.app-shell'));
  const dragover = new DragEvent('dragover', { bubbles: true, cancelable: true });
  const drop = new DragEvent('drop', { bubbles: true, cancelable: true });

  shell.dispatchEvent(dragover);
  shell.dispatchEvent(drop);
  expect(dragover.defaultPrevented).toBe(true);
  expect(drop.defaultPrevented).toBe(true);
});
