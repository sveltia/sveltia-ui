import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { html, text } from '../../test-utils/snippets.js';
import PromptDialog from './prompt-dialog.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * Wait until the dialog is open.
 */
const waitForOpen = async () => {
  await vi.waitFor(() => {
    expect(document.querySelector('dialog')?.open).toBe(true);
  });
};

it('renders a text input bound to the value', async () => {
  const oninput = vi.fn();

  /** @type {ComponentProps<typeof PromptDialog>} */
  const props = $state({
    open: true,
    title: 'Name',
    value: 'Initial',
    children: text('Enter a name'),
    textboxAttrs: { ariaLabel: 'Name', 'data-x': '1' },
    oninput,
  });

  await render(PromptDialog, props);
  await waitForOpen();

  const dialog = /** @type {HTMLDialogElement} */ (document.querySelector('dialog'));
  const input = /** @type {HTMLInputElement} */ (dialog.querySelector('.input-outer input'));

  expect(dialog.getAttribute('role')).toBe('alertdialog');
  expect(dialog.querySelector('.body')?.textContent).toContain('Enter a name');
  expect(input.value).toBe('Initial');
  expect(input.getAttribute('aria-label')).toBe('Name');
  expect(input.getAttribute('data-x')).toBe('1');
  expect(input.getAttribute('dir')).toBe('auto');
  await vi.waitFor(() => {
    expect(document.activeElement).toBe(input);
  });
  await userEvent.keyboard('Changed');
  expect(props.value).toBe('Changed');
  expect(oninput).toHaveBeenCalled();
});

it('labels the built-in input by the title unless told otherwise', async () => {
  await render(PromptDialog, { open: true, title: 'Name' });
  await waitForOpen();

  const dialog = /** @type {HTMLDialogElement} */ (document.querySelector('dialog'));
  const input = /** @type {HTMLInputElement} */ (dialog.querySelector('.input-outer input'));

  expect(dialog.getAttribute('aria-labelledby')).toBe(dialog.querySelector('.title')?.id);
  expect(input.getAttribute('aria-label')).toBe('Name');
});

it('drops the title label when the input is labelled by an element', async () => {
  await render(PromptDialog, {
    open: true,
    title: 'Name',
    children: html('<p id="prompt-hint">Enter your full name</p>'),
    textboxAttrs: { 'aria-labelledby': 'prompt-hint' },
  });
  await waitForOpen();

  const dialog = /** @type {HTMLDialogElement} */ (document.querySelector('dialog'));
  const input = /** @type {HTMLInputElement} */ (dialog.querySelector('.input-outer input'));

  expect(input.hasAttribute('aria-label')).toBe(false);
  expect(input.getAttribute('aria-labelledby')).toBe('prompt-hint');
});

it('renders a custom input instead', async () => {
  await render(PromptDialog, {
    open: true,
    title: 'Name',
    input: html('<textarea class="custom-input"></textarea>'),
  });

  await waitForOpen();

  const dialog = /** @type {HTMLDialogElement} */ (document.querySelector('dialog'));

  expect(dialog.querySelector('.input-outer .custom-input')).not.toBeNull();
  expect(dialog.querySelector('.input-outer input')).toBeNull();
});
