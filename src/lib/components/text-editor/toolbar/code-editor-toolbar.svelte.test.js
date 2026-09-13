import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import EditorFixture from '../editor-fixture.test.svelte';
import CodeEditorToolbar from './code-editor-toolbar.svelte';

it('renders the language switcher in a labelled toolbar', async () => {
  const screen = await render(EditorFixture, {
    config: { isCodeEditor: true },
    component: CodeEditorToolbar,
  });

  const toolbar = screen.getByRole('toolbar', { name: 'Code Editor' });

  await expect.element(toolbar).toHaveAttribute('aria-disabled', 'false');
  await expect.element(screen.getByRole('combobox', { name: 'Language' })).toBeVisible();
});

it('disables the toolbar and the switcher while disabled or read-only', async () => {
  /** @type {import('svelte').ComponentProps<typeof EditorFixture>} */
  const props = $state({
    config: { isCodeEditor: true },
    component: CodeEditorToolbar,
    componentProps: { readonly: true },
  });

  const screen = await render(EditorFixture, props);
  const toolbar = screen.getByRole('toolbar', { name: 'Code Editor' });
  const select = screen.getByRole('combobox', { name: 'Language' });

  await expect.element(toolbar).toHaveAttribute('aria-disabled', 'true');
  await expect.element(select).toHaveAttribute('aria-disabled', 'true');

  props.componentProps = { disabled: true };
  await expect.element(toolbar).toHaveAttribute('aria-disabled', 'true');
  await expect.element(select).toHaveAttribute('aria-disabled', 'true');

  props.componentProps = {};
  await vi.waitFor(() => {
    expect(toolbar.element().getAttribute('aria-disabled')).toBe('false');
  });
});
