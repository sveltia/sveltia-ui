import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { $getSelection as getSelection } from 'lexical';
import { getEditorStore } from '../../test-utils/editor.js';
import { OPEN_LINK_EDITOR_COMMAND } from './constants.js';
import EditorFixture from './editor-fixture.test.svelte';
import FloatingLinkEditor from './floating-link-editor.svelte';
import TextEditor from './text-editor.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 * @import { TextEditorStore } from '#lib/typedefs.js';
 */

/**
 * Get the popup.
 * @returns {HTMLElement | null} Element.
 */
const getPopup = () => document.querySelector('.sui.floating-link-editor');

/**
 * Get a button on the popup.
 * @param {string} label Accessible name.
 * @returns {HTMLButtonElement} Button.
 */
const getPopupButton = (label) =>
  /** @type {HTMLButtonElement} */ (getPopup()?.querySelector(`button[aria-label="${label}"]`));

/**
 * Get the URL field on the popup.
 * @returns {HTMLInputElement} Field.
 */
const getPopupInput = () => /** @type {HTMLInputElement} */ (getPopup()?.querySelector('input'));

/**
 * Place the caret within the given element’s text, or select it all.
 * @param {HTMLElement} root Editor root.
 * @param {Node} node Node to place the caret in.
 * @param {object} [options] Options.
 * @param {boolean} [options.selectAll] Whether to select the whole node instead.
 */
const placeCaret = (root, node, { selectAll = false } = {}) => {
  const range = document.createRange();
  const selection = /** @type {Selection} */ (window.getSelection());

  const textNode = /** @type {Text} */ (
    document.createTreeWalker(node, NodeFilter.SHOW_TEXT).nextNode()
  );

  root.focus();

  if (selectAll) {
    range.selectNodeContents(textNode);
  } else {
    range.setStart(textNode, 1);
    range.collapse(true);
  }

  selection.removeAllRanges();
  selection.addRange(range);
};

/**
 * Wait for the editor to pick up the selection made in the DOM, which it does asynchronously, on
 * the `selectionchange` event.
 * @param {TextEditorStore} store Editor store.
 * @param {string} text Selected text expected.
 */
const waitForSelectedText = async (store, text) => {
  await vi.waitFor(() => {
    expect(store.editor?.getEditorState().read(() => getSelection()?.getTextContent())).toBe(text);
  });
};

/**
 * Render the floating link editor with a live editor holding the given Markdown.
 * @param {string} value Markdown.
 * @returns {Promise<{ store: TextEditorStore, root: HTMLElement }>} The store and the editor root.
 */
const renderEditor = async (value) => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({ store: undefined, component: FloatingLinkEditor });
  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);
  const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

  await vi.waitFor(() => {
    expect(store.initialized).toBe(true);
  });
  store.inputValue = value;
  await vi.waitFor(() => {
    expect(root.querySelector('p')).not.toBeNull();
  });

  return { store, root };
};

describe('FloatingLinkEditor', () => {
  it('shows the URL of the link at the caret, only while the editor has the focus', async () => {
    const { root } = await renderEditor('See [Example](https://example.com/) here');

    expect(getPopup()).toBeNull();
    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('a')));
    await vi.waitFor(() => {
      expect(getPopup()).not.toBeNull();
    });

    const popup = /** @type {HTMLElement} */ (getPopup());
    const anchor = /** @type {HTMLAnchorElement} */ (popup.querySelector('a.url'));

    expect(popup.matches(':popover-open')).toBe(true);
    expect(popup.getAttribute('aria-label')).toBe('Link');
    expect(anchor.textContent?.trim()).toBe('https://example.com/');
    expect(anchor.href).toBe('https://example.com/');
    expect(anchor.target).toBe('_blank');
    expect(getPopupButton('Edit Link')).not.toBeNull();
    expect(getPopupButton('Remove Link')).not.toBeNull();

    // Placed below the link
    const linkRect = /** @type {HTMLElement} */ (root.querySelector('a')).getBoundingClientRect();

    expect(popup.getBoundingClientRect().top).toBeGreaterThanOrEqual(linkRect.bottom);

    // Moving the caret off the link hides the popup
    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('p')));
    await vi.waitFor(() => {
      expect(getPopup()).toBeNull();
    });

    // So does moving the focus elsewhere
    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('a')));
    await vi.waitFor(() => {
      expect(getPopup()).not.toBeNull();
    });
    root.blur();
    await vi.waitFor(() => {
      expect(getPopup()).toBeNull();
    });
  });

  it('dismisses the popup with Escape until the caret leaves the link', async () => {
    const { store, root } = await renderEditor('See [Example](https://example.com/) here');

    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('a')));
    await vi.waitFor(() => {
      expect(getPopup()).not.toBeNull();
    });
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => {
      expect(getPopup()).toBeNull();
    });
    // Still on the same link
    await userEvent.keyboard('{ArrowRight}');
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(getPopup()).toBeNull();
    // Off and back on the link
    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('p')));
    await vi.waitFor(() => {
      expect(store.selection.inlineTypes).not.toContain('link');
    });
    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('a')));
    await vi.waitFor(() => {
      expect(getPopup()).not.toBeNull();
    });
  });

  it('edits the URL of the link right there', async () => {
    const { store, root } = await renderEditor('See [Example](https://example.com/) here');

    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('a')));
    await vi.waitFor(() => {
      expect(getPopup()).not.toBeNull();
    });
    getPopupButton('Edit Link').click();
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getPopupInput());
    });
    expect(getPopupInput().value).toBe('https://example.com/');

    // An unsafe URL can’t be applied
    await userEvent.fill(getPopupInput(), ['javascript', 'alert(1)'].join(':'));
    await vi.waitFor(() => {
      expect(getPopupButton('Update').disabled).toBe(true);
    });
    expect(getPopupInput().getAttribute('aria-invalid')).toBe('true');
    await userEvent.keyboard('{Enter}');
    expect(store.inputValue).toBe('See [Example](https://example.com/) here');

    await userEvent.fill(getPopupInput(), 'https://example.org/');
    // Enter that commits an input method composition is not a submission
    getPopupInput().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true }),
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(store.inputValue).toBe('See [Example](https://example.com/) here');
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => {
      expect(store.inputValue).toBe('See [Example](https://example.org/) here');
    });
    // Back to the editor, still on the link
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(root);
    });
    await vi.waitFor(() => {
      expect(getPopup()?.querySelector('a.url')?.textContent?.trim()).toBe('https://example.org/');
    });

    // With the Update button
    getPopupButton('Edit Link').click();
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getPopupInput());
    });
    await userEvent.fill(getPopupInput(), 'https://sveltia.dev/');
    getPopupButton('Update').click();
    await vi.waitFor(() => {
      expect(store.inputValue).toBe('See [Example](https://sveltia.dev/) here');
    });
  });

  it('cancels editing with Escape, the Cancel button or by moving the focus away', async () => {
    const { store, root } = await renderEditor('See [Example](https://example.com/) here');
    const original = store.inputValue;

    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('a')));
    await vi.waitFor(() => {
      expect(getPopup()).not.toBeNull();
    });

    // Escape
    getPopupButton('Edit Link').click();
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getPopupInput());
    });
    await userEvent.fill(getPopupInput(), 'https://example.org/');
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(root);
    });
    expect(getPopupInput()).toBeNull();

    // Cancel button
    getPopupButton('Edit Link').click();
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getPopupInput());
    });
    getPopupButton('Cancel').click();
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(root);
    });

    // Focus moved back to the text
    getPopupButton('Edit Link').click();
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getPopupInput());
    });
    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('p')));
    await vi.waitFor(() => {
      expect(getPopup()).toBeNull();
    });

    expect(store.inputValue).toBe(original);
  });

  it('keeps the focus when the popup background is pressed', async () => {
    const { root } = await renderEditor('See [Example](https://example.com/) here');

    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('a')));
    await vi.waitFor(() => {
      expect(getPopup()).not.toBeNull();
    });

    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });

    getPopup()?.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('removes the link, keeping its text', async () => {
    const { store, root } = await renderEditor('See [Example](https://example.com/) here');

    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('a')));
    await vi.waitFor(() => {
      expect(getPopup()).not.toBeNull();
    });
    getPopupButton('Remove Link').click();
    await vi.waitFor(() => {
      expect(store.inputValue).toBe('See Example here');
    });
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(root);
    });
    expect(getPopup()).toBeNull();
  });

  it('opens the edit mode with the command for the link at the caret', async () => {
    const { store, root } = await renderEditor('See [Example](https://example.com/) here');

    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('a')));
    await vi.waitFor(() => {
      expect(getPopup()).not.toBeNull();
    });
    expect(store.editor?.dispatchCommand(OPEN_LINK_EDITOR_COMMAND, undefined)).toBe(true);
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getPopupInput());
    });
    expect(getPopupInput().value).toBe('https://example.com/');
  });

  it('links the selected text with the command, prefilling the URL only with a URL', async () => {
    const { store, root } = await renderEditor('Hello');

    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('p')), { selectAll: true });
    await waitForSelectedText(store, 'Hello');
    expect(store.editor?.dispatchCommand(OPEN_LINK_EDITOR_COMMAND, undefined)).toBe(true);
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getPopupInput());
    });
    expect(getPopupInput().value).toBe('');
    expect(getPopupButton('Insert').disabled).toBe(true);
    await userEvent.fill(getPopupInput(), 'https://example.com/');
    getPopupButton('Insert').click();
    await vi.waitFor(() => {
      expect(store.inputValue).toBe('[Hello](https://example.com/)');
    });
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(root);
    });
  });

  it('prefills the URL with the selected URL', async () => {
    const { store, root } = await renderEditor('https://example.com/');

    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('p')), { selectAll: true });
    await waitForSelectedText(store, 'https://example.com/');
    store.editor?.dispatchCommand(OPEN_LINK_EDITOR_COMMAND, undefined);
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getPopupInput());
    });
    expect(getPopupInput().value).toBe('https://example.com/');
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => {
      expect(store.inputValue).toBe('[https://example.com/](https://example.com/)');
    });
  });

  it('links text selected backwards', async () => {
    const { store, root } = await renderEditor('Hello');

    const textNode = /** @type {Text} */ (
      document.createTreeWalker(root, NodeFilter.SHOW_TEXT).nextNode()
    );

    root.focus();
    window.getSelection()?.setBaseAndExtent(textNode, 5, textNode, 0);
    await waitForSelectedText(store, 'Hello');
    store.editor?.dispatchCommand(OPEN_LINK_EDITOR_COMMAND, undefined);
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getPopupInput());
    });

    // Placed below the text
    const textRect = /** @type {HTMLElement} */ (root.querySelector('p')).getBoundingClientRect();

    expect(getPopup()?.getBoundingClientRect().top).toBeGreaterThanOrEqual(textRect.top);
    await userEvent.fill(getPopupInput(), 'https://example.com/');
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => {
      expect(store.inputValue).toBe('[Hello](https://example.com/)');
    });
  });

  it('leaves Escape to the editor while the caret is not on a link', async () => {
    const { store, root } = await renderEditor('Hello');
    /** @type {boolean | undefined} */
    let handled;

    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('p')));
    await waitForSelectedText(store, '');
    root.addEventListener(
      'keydown',
      (event) => {
        handled = event.defaultPrevented;
      },
      { once: true },
    );
    await userEvent.keyboard('{Escape}');
    expect(handled).toBe(false);
  });

  it('ends the edit mode when the link is gone or the editor becomes read-only', async () => {
    const { store, root } = await renderEditor('See [Example](https://example.com/) here');

    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('a')));
    await vi.waitFor(() => {
      expect(getPopup()).not.toBeNull();
    });
    store.editor?.dispatchCommand(OPEN_LINK_EDITOR_COMMAND, undefined);
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getPopupInput());
    });
    // Replace the content behind the popup’s back
    store.inputValue = 'Gone';
    await vi.waitFor(() => {
      expect(getPopup()).toBeNull();
    });

    // Same with the selected text to be linked
    store.inputValue = 'Hello';
    await vi.waitFor(() => {
      expect(root.textContent).toBe('Hello');
    });
    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('p')), { selectAll: true });
    await waitForSelectedText(store, 'Hello');
    store.editor?.dispatchCommand(OPEN_LINK_EDITOR_COMMAND, undefined);
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getPopupInput());
    });
    store.inputValue = 'Bye';
    await vi.waitFor(() => {
      expect(getPopup()).toBeNull();
    });

    store.inputValue = 'See [Example](https://example.com/) here';
    await vi.waitFor(() => {
      expect(root.querySelector('a')).not.toBeNull();
    });
    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('a')));
    await vi.waitFor(() => {
      expect(getPopup()).not.toBeNull();
    });
    store.editor?.dispatchCommand(OPEN_LINK_EDITOR_COMMAND, undefined);
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getPopupInput());
    });
    store.editor?.setEditable(false);
    await vi.waitFor(() => {
      expect(getPopup()?.querySelector('input') ?? null).toBeNull();
    });
  });

  it('leaves the command to the dialog when there is no link or text to edit', async () => {
    const { store, root } = await renderEditor('Hello');

    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('p')));
    expect(store.editor?.dispatchCommand(OPEN_LINK_EDITOR_COMMAND, undefined)).toBe(false);
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(getPopup()).toBeNull();
  });

  it('closes when the editor switches to the plain text mode', async () => {
    const { store, root } = await renderEditor('See [Example](https://example.com/) here');

    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('a')));
    await vi.waitFor(() => {
      expect(getPopup()).not.toBeNull();
    });
    store.useRichText = false;
    await vi.waitFor(() => {
      expect(getPopup()).toBeNull();
    });
  });
});

describe('FloatingLinkEditor (in TextEditor)', () => {
  it('opens from the Link button and the keyboard shortcut instead of the dialog', async () => {
    const props = $state({ value: 'See [Example](https://example.com/) here' });
    const screen = await render(TextEditor, props);
    const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));
    const modifier = navigator.platform.includes('Mac') ? 'Meta' : 'Control';

    await vi.waitFor(() => {
      expect(root.querySelector('a')).not.toBeNull();
    });
    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('a')));
    await userEvent.keyboard(`{${modifier}>}k{/${modifier}}`);
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getPopupInput());
    });
    expect(document.querySelector('dialog[open]')).toBeNull();
    await userEvent.fill(getPopupInput(), 'https://example.org/');
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => {
      expect(props.value).toBe('See [Example](https://example.org/) here');
    });

    // The Link button, with the selected text
    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('p')), { selectAll: true });
    await screen.getByRole('button', { name: 'Link', exact: true }).click();
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getPopupInput());
    });
    expect(document.querySelector('dialog[open]')).toBeNull();
  });

  it('is not rendered when the editor is read-only or the link button is disabled', async () => {
    const screen = await render(TextEditor, {
      value: 'See [Example](https://example.com/) here',
      readonly: true,
    });

    const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

    await vi.waitFor(() => {
      expect(root.querySelector('a')).not.toBeNull();
    });
    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('a')));
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(getPopup()).toBeNull();
  });
});
