import { mount, unmount } from 'svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TextEditor from './text-editor.svelte';
import { createTestComponent } from '../../test-utils/editor.js';

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
          buttons: ['bold'],
        },
      }),
    );
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
