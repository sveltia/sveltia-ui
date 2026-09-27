import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { $getRoot as getRoot, $getSelection as getSelection } from 'lexical';
import EditorFixture from './editor-fixture.test.svelte';
import LexicalRoot from './lexical-root.svelte';
import { createTestComponent, getEditorStore } from '../../test-utils/editor.js';

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

    // Lexical renders the link text as a child element, which is what actually gets clicked
    const text = document.createElement('span');

    link.appendChild(text);

    const textEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

    text.dispatchEvent(textEvent);
    expect(textEvent.defaultPrevented).toBe(true);

    const other = new MouseEvent('click', { bubbles: true, cancelable: true });

    root.dispatchEvent(other);
    expect(other.defaultPrevented).toBe(false);
  });

  it('places the caret after a decorator or at the end of a block when there’s no text to click', async () => {
    const component = createTestComponent({ id: 'box', label: 'Box', markdown: '<box>' });
    /** @type {ComponentProps<typeof EditorFixture>} */
    const props = $state({ store: undefined, config: { components: [component] } });
    const screen = await render(EditorFixture, props);
    const store = getEditorStore(props);
    const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

    await vi.waitFor(() => {
      expect(store.initialized).toBe(true);
    });

    const { editor } = /** @type {{ editor: import('lexical').LexicalEditor }} */ (store);

    /**
     * Get the types of the root children, and the type of the node with the caret.
     * @returns {{ types: string[], caret: string | undefined }} Result.
     */
    const getState = () =>
      editor.getEditorState().read(() => ({
        types: getRoot()
          .getChildren()
          .map((node) => node.getType()),
        caret: getSelection()?.getNodes()[0]?.getType(),
      }));

    /**
     * Press the mouse button on the given element.
     * @param {Element} target Target.
     * @param {MouseEventInit} [init] Event options.
     * @returns {boolean} Whether the default action has been prevented.
     */
    const mouseDown = (target, init = {}) =>
      !target.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, ...init }),
      );

    editor.update(
      () => {
        getRoot().clear().append(component.createNode(), component.createNode());
      },
      { discrete: true },
    );

    /**
     * Get the decorator elements.
     * @returns {Element[]} Elements.
     */
    const getDecorators = () => [...root.querySelectorAll('[data-lexical-decorator]')];

    // The static content of the last decorator: a new paragraph is added after it
    expect(mouseDown(getDecorators()[1])).toBe(true);
    await vi.waitFor(() => {
      expect(getState()).toEqual({ types: ['box', 'box', 'paragraph'], caret: 'paragraph' });
    });
    expect(document.activeElement).toBe(root);

    // The empty area beside the first decorator: a new paragraph is added between them
    expect(mouseDown(root, { clientY: getDecorators()[0].getBoundingClientRect().top + 1 })).toBe(
      true,
    );
    await vi.waitFor(() => {
      expect(getState().types).toEqual(['box', 'paragraph', 'box', 'paragraph']);
    });

    // The empty area below the last paragraph: the caret moves to its end
    editor.update(
      () => {
        getRoot().getFirstChildOrThrow().selectStart();
      },
      { discrete: true },
    );
    expect(mouseDown(root, { clientY: root.getBoundingClientRect().bottom - 1 })).toBe(true);
    await vi.waitFor(() => {
      expect(getState()).toEqual({
        types: ['box', 'paragraph', 'box', 'paragraph'],
        caret: 'paragraph',
      });
    });

    // Anything else is left to the browser
    const paragraph = /** @type {HTMLElement} */ (root.querySelector('p'));
    const input = document.createElement('input');

    getDecorators()[0].append(input);
    expect(mouseDown(paragraph)).toBe(false);
    expect(mouseDown(input)).toBe(false);
    expect(mouseDown(getDecorators()[0], { shiftKey: true })).toBe(false);
    expect(mouseDown(getDecorators()[0], { button: 2 })).toBe(false);
    expect(mouseDown(root, { clientY: root.getBoundingClientRect().top - 10 })).toBe(false);
    expect(mouseDown(root, { clientY: paragraph.getBoundingClientRect().top + 1 })).toBe(false);
    input.remove();

    // A decorator of a nested editor is left to that editor
    const nested = document.createElement('div');
    const nestedDecorator = document.createElement('div');

    nested.dataset.lexicalEditor = 'true';
    nestedDecorator.dataset.lexicalDecorator = 'true';
    nested.append(nestedDecorator);
    getDecorators()[0].append(nested);
    expect(mouseDown(nestedDecorator)).toBe(false);
    nested.remove();

    // An event already handled is left alone
    const handled = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 });

    /**
     * Get the key of the node with the caret.
     * @returns {string | undefined} Key.
     */
    const getCaretKey = () =>
      editor.getEditorState().read(() => getSelection()?.getNodes()[0]?.getKey());

    const caretKey = getCaretKey();

    handled.preventDefault();
    getDecorators()[0].dispatchEvent(handled);
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(getCaretKey()).toBe(caretKey);

    // A read-only editor is left alone, so nothing is added
    editor.setEditable(false);
    expect(mouseDown(getDecorators()[1])).toBe(false);
    expect(mouseDown(root, { clientY: root.getBoundingClientRect().bottom - 1 })).toBe(false);
    expect(getState().types).toEqual(['box', 'paragraph', 'box', 'paragraph']);
    editor.setEditable(true);
  });
});
