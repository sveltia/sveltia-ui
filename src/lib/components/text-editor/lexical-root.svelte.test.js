import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import EditorFixture from './editor-fixture.test.svelte';
import LexicalRoot from './lexical-root.svelte';
import { getEditorStore } from '../../test-utils/editor.js';

/**
 * @import { ComponentProps } from 'svelte';
 * @import { TextEditorStore } from '$lib/typedefs';
 */

describe('LexicalRoot', () => {
  it('initializes the editor in the store and renders an editable text box', async () => {
    /** @type {ComponentProps<typeof EditorFixture>} */
    const props = $state({ store: undefined });
    const screen = await render(EditorFixture, props);
    const store = getEditorStore(props);
    const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

    await vi.waitFor(() => {
      expect(store.initialized).toBe(true);
    });
    expect(store.editor).toBeDefined();
    expect(store.editor?.getRootElement()).toBe(root);
    expect(store.enabledTransformers.length).toBeGreaterThan(0);
    expect(root.id).toBe(`${store.editorId}-lexical-root`);
    expect(root.getAttribute('role')).toBe('textbox');
    expect(root.getAttribute('aria-multiline')).toBe('true');
    expect(root.contentEditable).toBe('true');
    expect(root.classList.contains('code')).toBe(false);

    await screen.unmount();
    expect(store.initialized).toBe(false);
    expect(store.editor).toBeUndefined();
  });

  it('reflects the state props and toggles whether the content can be edited', async () => {
    /** @type {ComponentProps<typeof EditorFixture>} */
    const props = $state({
      store: undefined,
      componentProps: { hidden: true, disabled: true, required: true, invalid: true, class: 'x' },
      component: LexicalRoot,
      withRoot: false,
    });

    const screen = await render(EditorFixture, props);
    const store = getEditorStore(props);
    const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

    await vi.waitFor(() => {
      expect(store.initialized).toBe(true);
    });
    expect(root.hidden).toBe(true);
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.getAttribute('aria-disabled')).toBe('true');
    expect(root.getAttribute('aria-required')).toBe('true');
    expect(root.getAttribute('aria-invalid')).toBe('true');
    expect(root.contentEditable).toBe('false');
    expect(store.editor?.isEditable()).toBe(false);

    props.componentProps = { readonly: true };
    await vi.waitFor(() => {
      expect(root.getAttribute('aria-readonly')).toBe('true');
    });
    expect(store.editor?.isEditable()).toBe(false);

    props.componentProps = {};
    await vi.waitFor(() => {
      expect(root.contentEditable).toBe('true');
    });
    expect(store.editor?.isEditable()).toBe(true);
  });

  it('marks the root as a code editor from the config', async () => {
    const screen = await render(EditorFixture, { config: { isCodeEditor: true } });

    expect(screen.container.querySelector('.lexical-root')?.classList.contains('code')).toBe(true);
  });

  it('syncs the store with editor updates', async () => {
    /** @type {ComponentProps<typeof EditorFixture>} */
    const props = $state({ store: undefined });
    const screen = await render(EditorFixture, props);
    const store = getEditorStore(props);
    const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

    await vi.waitFor(() => {
      expect(store.initialized).toBe(true);
    });

    const selection = { blockNodeKey: '1', blockType: 'heading-1', inlineTypes: ['bold'] };

    root.dispatchEvent(new CustomEvent('Update', { detail: { value: '# Hi', selection } }));
    expect(store.inputValue).toBe('# Hi');
    expect(store.selection).toEqual(selection);
    expect(store.useRichText).toBe(true);

    // Updates are ignored in plain text mode
    store.useRichText = false;
    root.dispatchEvent(
      new CustomEvent('Update', { detail: { value: 'Other', selection: store.selection } }),
    );
    expect(store.inputValue).toBe('# Hi');
  });

  it('keeps links from being followed when clicked', async () => {
    const screen = await render(EditorFixture);
    const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));
    const link = document.createElement('a');

    link.href = 'https://example.com/';
    root.appendChild(link);

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });

    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);

    const other = new MouseEvent('click', { bubbles: true, cancelable: true });

    root.dispatchEvent(other);
    expect(other.defaultPrevented).toBe(false);
  });
});
