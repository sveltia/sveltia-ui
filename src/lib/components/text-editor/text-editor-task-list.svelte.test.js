import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import TextEditor from './text-editor.svelte';
import { createPasteEvent } from '../../test-utils/editor.js';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * Buttons including the task list.
 * @type {ComponentProps<typeof TextEditor>['buttons']}
 */
const BUTTONS = ['bold', 'bulleted-list', 'numbered-list', 'task-list'];

/**
 * Render the editor and wait for the given number of task list items.
 * @param {ComponentProps<typeof TextEditor>} props Props.
 * @param {number} count Number of task list items.
 * @returns {Promise<{ screen: Awaited<ReturnType<typeof render<typeof TextEditor>>>, root:
 * HTMLElement }>} Rendered editor and its root.
 */
const renderTaskList = async (props, count) => {
  const screen = await render(TextEditor, props);
  const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

  await vi.waitFor(() => {
    expect(root.querySelectorAll('li.task-list-item')).toHaveLength(count);
  });

  return { screen, root };
};

/**
 * Click the check box of the given task list item, drawn at the start of the item.
 * @param {HTMLElement} item List item.
 */
const clickCheckbox = async (item) => {
  await page.elementLocator(item).click({ position: { x: 4, y: 6 } });
};

describe('TextEditor task list', () => {
  it('shows the items with check boxes and toggles them with a click, in Markdown', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: '- [ ] To do\n- [x] Done', buttons: BUTTONS });
    const { root } = await renderTaskList(props, 2);
    const [first, second] = /** @type {HTMLElement[]} */ ([...root.querySelectorAll('li')]);

    expect(first.classList.contains('checked')).toBe(false);
    expect(first.getAttribute('aria-checked')).toBe('false');
    expect(second.classList.contains('checked')).toBe(true);
    expect(getComputedStyle(first).listStyleType).toBe('none');
    expect(getComputedStyle(first, '::before').width).not.toBe('auto');

    await clickCheckbox(first);
    await vi.waitFor(() => {
      expect(props.value).toBe('- [x] To do\n- [x] Done');
    });

    await clickCheckbox(second);
    await vi.waitFor(() => {
      expect(props.value).toBe('- [x] To do\n- [ ] Done');
    });

    // Clicking the text places the caret instead
    await page.elementLocator(first).click({ position: { x: 60, y: 6 } });
    expect(props.value).toBe('- [x] To do\n- [ ] Done');
  });

  it('draws no check box for an item that only holds a nested list', async () => {
    const { root } = await renderTaskList({ value: '- [ ] One\n  - [x] Two', buttons: BUTTONS }, 3);
    const wrapper = /** @type {HTMLElement} */ (root.querySelector('li.nested'));

    expect(wrapper.classList.contains('task-list-item')).toBe(true);
    expect(getComputedStyle(wrapper, '::before').content).toBe('none');
    expect(getComputedStyle(wrapper).paddingInlineStart).toBe('0px');
    // The nested item has one
    expect(
      getComputedStyle(/** @type {HTMLElement} */ (wrapper.querySelector('li')), '::before')
        .content,
    ).not.toBe('none');
  });

  it('turns a paragraph into a task list item from the text style menu', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: 'Bring a hat', buttons: BUTTONS });
    const screen = await render(TextEditor, props);
    const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

    await vi.waitFor(() => {
      expect(root.textContent).toBe('Bring a hat');
    });

    root.focus();
    await screen.getByRole('button', { name: 'Show Text Style Options' }).click();
    await screen.getByRole('menuitemcheckbox', { name: 'Task List' }).click();
    await vi.waitFor(() => {
      expect(props.value).toBe('- [ ] Bring a hat');
    });

    // The menu shows the current block type
    await screen.getByRole('button', { name: 'Show Text Style Options' }).click();
    await expect
      .element(screen.getByRole('menuitemcheckbox', { name: 'Task List' }))
      .toHaveAttribute('aria-checked', 'true');
  });

  it('turns lines into task list items in the plain text mode', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: 'One', buttons: BUTTONS, modes: ['plain-text', 'rich-text'] });
    const screen = await render(TextEditor, props);

    const textarea = /** @type {HTMLTextAreaElement} */ (
      screen.container.querySelector('textarea')
    );

    await vi.waitFor(() => {
      expect(textarea.checkVisibility()).toBe(true);
    });

    textarea.focus();
    textarea.setSelectionRange(0, 3);
    await screen.getByRole('button', { name: 'Show Text Style Options' }).click();
    await screen.getByRole('menuitemcheckbox', { name: 'Task List' }).click();
    await vi.waitFor(() => {
      expect(props.value).toBe('- [ ] One');
    });
  });

  it('keeps a task list in HTML, and toggles an item', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({
      format: 'html',
      value:
        '<ul class="contains-task-list">' +
        '<li class="task-list-item"><input type="checkbox" disabled=""> To do</li></ul>',
      buttons: BUTTONS,
    });

    const { root } = await renderTaskList(props, 1);

    // The HTML can be edited in the rich text mode
    expect(document.querySelector('[role="alert"]')).toBeNull();
    await clickCheckbox(/** @type {HTMLElement} */ (root.querySelector('li')));
    await vi.waitFor(() => {
      expect(props.value).toBe(
        '<ul class="contains-task-list">' +
          '<li class="task-list-item"><input type="checkbox" disabled="" checked=""> To do</li>' +
          '</ul>',
      );
    });
  });

  it('turns a pasted task list into a bulleted list without the task list button', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: 'Intro', buttons: ['bold', 'bulleted-list'] });
    const screen = await render(TextEditor, props);
    const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));
    const clipboardData = new DataTransfer();

    await vi.waitFor(() => {
      expect(root.textContent).toBe('Intro');
    });

    root.focus();
    await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');
    clipboardData.setData(
      'text/html',
      '<ul class="contains-task-list">' +
        '<li class="task-list-item"><input type="checkbox" disabled checked> Done</li></ul>',
    );
    root.dispatchEvent(createPasteEvent(clipboardData));
    await vi.waitFor(() => {
      expect(props.value).toBe('- Done');
    });
    expect(root.querySelector('li.task-list-item')).toBeNull();
    expect(document.querySelector('[aria-label="Task List"]')).toBeNull();
  });
});
