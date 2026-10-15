import { sleep } from '@sveltia/utils/misc';
import { mount, unmount } from 'svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import TextEditor from './text-editor.svelte';
import { createTestComponent } from '../../test-utils/editor.js';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * Editors mounted in the nested component, unmounted after each test.
 * @type {Record<string, any>[]}
 */
const innerEditors = [];

/**
 * Inline component rendering a text editor with enough lines to be taller than the scrolling
 * container, like an editor component with a rich text field of its own.
 */
const nested = createTestComponent({
  id: 'nested',
  label: 'Nested',
  markdown: '[nested]',
  inline: true,
  pattern: /\[nested\]/,
  /**
   * Render a text editor in the node.
   * @param {HTMLElement} element Element created for the node.
   */
  onCreateDOM: (element) => {
    innerEditors.push(
      mount(TextEditor, {
        target: element,
        props: {
          value: Array.from({ length: 40 }, (_, index) => `Inner ${index + 1}`).join('\n\n'),
          buttons: ['bold', 'heading-1'],
        },
      }),
    );
  },
});

/**
 * Inline component with a text field, like an editor component with a String field.
 */
const field = createTestComponent({
  id: 'field',
  label: 'Field',
  markdown: '[field]',
  inline: true,
  pattern: /\[field\]/,
  /**
   * Render a text field in the node.
   * @param {HTMLElement} element Element created for the node.
   */
  onCreateDOM: (element) => {
    const input = document.createElement('input');

    input.setAttribute('aria-label', 'Field Input');
    element.append(input);
  },
});

afterEach(() => {
  innerEditors.splice(0).forEach((editor) => unmount(editor));
});

it('stacks the sticky toolbar of a nested editor below the outer one', async () => {
  const after = Array.from({ length: 40 }, (_, index) => `After ${index + 1}`).join('\n\n');

  const screen = await render(TextEditor, {
    value: `Outer\n\n[nested]\n\n${after}`,
    buttons: ['bold'],
    components: [nested],
    // The toolbar height set on the root is kept along with the given style
    style: 'color: inherit',
  });

  const { container } = screen;

  container.style.height = '400px';
  container.style.overflow = 'auto';

  await expect.element(screen.getByText('Inner 40')).toBeInTheDocument();

  const [outerEditor, innerEditor] = /** @type {HTMLElement[]} */ ([
    ...container.querySelectorAll('.sui.text-editor'),
  ]);

  const [outerToolbar, innerToolbar] = /** @type {HTMLElement[]} */ ([
    ...container.querySelectorAll('[role="toolbar"]'),
  ]);

  expect(outerEditor.contains(innerEditor)).toBe(true);

  /**
   * Get the position of an element relative to the top of the scrolling container.
   * @param {HTMLElement} element Element.
   * @returns {number} Position.
   */
  const getTop = (element) =>
    element.getBoundingClientRect().top - container.getBoundingClientRect().top;

  // Scroll to the middle of the nested editor
  container.scrollTop += getTop(innerEditor) + 200;

  await vi.waitFor(() => {
    expect(getTop(outerToolbar)).toBeCloseTo(0, 0);
    // The outer editor’s content used to be the scrolling container of the inner toolbar, which
    // then didn’t stick, and it would otherwise stick to the top, behind the outer toolbar
    expect(getTop(innerToolbar)).toBeCloseTo(outerToolbar.getBoundingClientRect().height, 0);
  });

  // The outer toolbar stays on top of the inner one once the nested editor is scrolled away
  expect(Number(getComputedStyle(innerToolbar).zIndex)).toBeLessThan(
    Number(getComputedStyle(outerToolbar).zIndex),
  );

  // Scroll past the nested editor
  container.scrollTop += innerEditor.getBoundingClientRect().height;

  await vi.waitFor(() => {
    expect(getTop(outerToolbar)).toBeCloseTo(0, 0);
    expect(innerToolbar.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      innerEditor.getBoundingClientRect().bottom,
    );
  });
});

it('disables the outer toolbar while an editor component has focus', async () => {
  const screen = await render(TextEditor, {
    value: 'Outer\n\n[nested]\n\n[field]',
    buttons: ['bold'],
    components: [nested, field],
  });

  const [outerToolbar, innerToolbar] = screen.getByRole('toolbar', { name: 'Text Editor' }).all();
  const outerTextbox = screen.getByRole('textbox').first();

  await expect.element(screen.getByText('Inner 1', { exact: true })).toBeInTheDocument();
  await expect.element(outerToolbar).toHaveAttribute('aria-disabled', 'false');

  // In a nested editor, only its own toolbar applies
  await userEvent.click(screen.getByText('Inner 1', { exact: true }));
  await expect.element(outerToolbar).toHaveAttribute('aria-disabled', 'true');
  await expect.element(innerToolbar).toHaveAttribute('aria-disabled', 'false');
  // The sticky toolbar keeps its background opaque, with only the buttons dimmed
  expect(getComputedStyle(outerToolbar.element()).filter).toBe('none');
  expect(
    getComputedStyle(/** @type {Element} */ (outerToolbar.element().firstElementChild)).filter,
  ).not.toBe('none');

  // Including a menu opened from the nested editor’s toolbar
  await userEvent.click(innerToolbar.getByRole('button', { name: 'Show Text Style Options' }));
  await expect.element(screen.getByRole('menuitemcheckbox', { name: 'Heading 1' })).toBeVisible();
  await expect.element(outerToolbar).toHaveAttribute('aria-disabled', 'true');
  await userEvent.keyboard('{Escape}');

  // In another field of a component
  await userEvent.click(screen.getByRole('textbox', { name: 'Field Input' }));
  await expect.element(outerToolbar).toHaveAttribute('aria-disabled', 'true');

  // Back in the outer editor itself
  await userEvent.click(outerTextbox.getByText('Outer', { exact: true }));
  await expect.element(outerToolbar).toHaveAttribute('aria-disabled', 'false');

  // Out of the editor from a component
  await userEvent.click(screen.getByRole('textbox', { name: 'Field Input' }));
  await expect.element(outerToolbar).toHaveAttribute('aria-disabled', 'true');
  /** @type {HTMLElement} */ (document.activeElement).blur();
  await expect.element(outerToolbar).toHaveAttribute('aria-disabled', 'false');
});

it('enables the toolbar once the focus leaves the editor in a modal dialog', async () => {
  const screen = await render(TextEditor, {
    value: 'Outer\n\n[field]',
    buttons: ['bold'],
    components: [field],
  });

  const dialog = document.createElement('dialog');
  const otherInput = document.createElement('input');
  const outerToolbar = screen.getByRole('toolbar', { name: 'Text Editor' });
  const fieldInput = screen.getByRole('textbox', { name: 'Field Input' });

  otherInput.setAttribute('aria-label', 'Other Input');
  document.body.append(dialog);
  dialog.append(screen.container, otherInput);
  dialog.showModal();

  try {
    // Another field of the dialog the editor is in
    await userEvent.click(fieldInput);
    await expect.element(outerToolbar).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(screen.getByRole('textbox', { name: 'Other Input' }));
    await expect.element(outerToolbar).toHaveAttribute('aria-disabled', 'false');

    // A component field losing focus, e.g. as the component is removed
    await userEvent.click(fieldInput);
    await expect.element(outerToolbar).toHaveAttribute('aria-disabled', 'true');
    fieldInput.element().remove();
    await expect.element(outerToolbar).toHaveAttribute('aria-disabled', 'false');
  } finally {
    dialog.close();
    dialog.remove();
  }
});

it('applies a keyboard shortcut in a nested editor only to that editor', async () => {
  const value = 'Outer\n\n[nested]';
  /** @type {ComponentProps<typeof TextEditor>} */
  const props = $state({ value, buttons: ['bold'], components: [nested] });
  const screen = await render(TextEditor, props);
  const innerLine = screen.getByText('Inner 1', { exact: true });

  await expect.element(innerLine).toBeInTheDocument();
  await userEvent.tripleClick(innerLine);
  await userEvent.keyboard('{ControlOrMeta>}b{/ControlOrMeta}');

  await vi.waitFor(() => {
    expect(innerLine.element().closest('strong')).not.toBeNull();
  });
  await sleep(200);
  expect(props.value).toBe(value);
});
