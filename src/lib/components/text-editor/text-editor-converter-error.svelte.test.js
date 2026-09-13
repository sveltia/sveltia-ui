import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TextEditor from './text-editor.svelte';

vi.mock('./core.js', async (importOriginal) => ({
  .../** @type {object} */ (await importOriginal()),
  /**
   * Fail to convert the Markdown.
   * @throws {Error} Always.
   */
  convertMarkdownToLexical: async () => {
    throw new Error('Unsupported syntax');
  },
}));

beforeEach(() => {
  // Let the timers run, but allow the toast’s timer to be fast-forwarded
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

it('falls back to the plain text editor with a notice when the Markdown cannot be converted', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const screen = await render(TextEditor, { value: 'Hello' });
  const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.text-editor'));

  await vi.waitFor(() => {
    expect(wrapper.querySelector('textarea')?.checkVisibility()).toBe(true);
  });
  await expect.element(screen.getByRole('alert')).toBeVisible();
  expect(screen.getByRole('alert').element().textContent).toContain(
    'Unable to enable rich text mode',
  );
  await expect.element(screen.getByRole('button', { name: 'Edit in Markdown' })).toBeDisabled();
  expect(error).toHaveBeenCalled();
  error.mockRestore();

  // The notice goes away by itself
  await vi.advanceTimersByTimeAsync(5000);
  await vi.waitFor(() => {
    expect(document.querySelector('.sui.toast')).toBeNull();
  });
});
