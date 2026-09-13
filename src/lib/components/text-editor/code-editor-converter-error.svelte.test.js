import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CodeEditor from './code-editor.svelte';

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

it('shows a notice when the code cannot be loaded into the editor', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const screen = await render(CodeEditor, { code: 'x' });

  await expect.element(screen.getByRole('alert')).toBeVisible();
  expect(screen.getByRole('alert').element().textContent).toContain(
    'Unable to enable rich text mode',
  );
  expect(error).toHaveBeenCalled();
  error.mockRestore();

  // The notice goes away by itself
  await vi.advanceTimersByTimeAsync(5000);
  await vi.waitFor(() => {
    expect(document.querySelector('.sui.toast')).toBeNull();
  });
});
