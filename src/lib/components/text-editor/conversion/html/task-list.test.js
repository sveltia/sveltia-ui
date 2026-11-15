import { afterEach, describe, expect, it } from 'vitest';
import { BLOCK_BUTTON_TYPES, INLINE_BUTTON_TYPES } from '../../constants.js';
import { disposeEditors, markdownToHtml, roundTrip } from '#lib/test-utils/html-editor.js';

afterEach(disposeEditors);

describe('task lists', () => {
  const TASK_LIST_HTML =
    '<ul class="contains-task-list">' +
    '<li class="task-list-item"><input type="checkbox" disabled=""> To do</li>' +
    '<li class="task-list-item"><input type="checkbox" disabled="" checked=""> Done</li>' +
    '</ul>';

  it('should export a task list the way GitHub renders it, and import it back', async () => {
    expect(await markdownToHtml('- [ ] To do\n- [x] Done')).toBe(TASK_LIST_HTML);
    expect(await roundTrip(TASK_LIST_HTML)).toBe(TASK_LIST_HTML);
  });

  it('should import the HTML of GitHub and markdown-it, with other attributes on the check box', async () => {
    expect(
      await roundTrip(
        '<ul class="contains-task-list">\n' +
          '<li class="task-list-item"><input class="task-list-item-checkbox" type="checkbox" ' +
          'checked disabled> Done</li>\n</ul>',
      ),
    ).toBe(
      '<ul class="contains-task-list">' +
        '<li class="task-list-item"><input type="checkbox" disabled="" checked=""> Done</li></ul>',
    );
  });

  it('should only add a check box to the items that have content, not to a nested list', async () => {
    expect(await markdownToHtml('- [ ] One\n  - [x] Two')).toBe(
      '<ul class="contains-task-list">' +
        '<li class="task-list-item"><input type="checkbox" disabled=""> One' +
        '<ul class="contains-task-list">' +
        '<li class="task-list-item"><input type="checkbox" disabled="" checked=""> Two</li>' +
        '</ul></li></ul>',
    );
  });

  it('should keep a paragraph that only starts like a task list item', async () => {
    expect(await markdownToHtml('[x] Agreed\n\n[] Empty\n\n- [] Empty')).toBe(
      '<p>[x] Agreed</p><p>[] Empty</p><ul><li>[] Empty</li></ul>',
    );
  });

  it('should turn a task list into a bulleted list without the task list button', async () => {
    const enabledButtons = [...INLINE_BUTTON_TYPES, ...BLOCK_BUTTON_TYPES].filter(
      (type) => type !== 'task-list',
    );

    expect(await roundTrip('<ul><li aria-checked="true">Done</li></ul>', { enabledButtons })).toBe(
      '<ul><li>Done</li></ul>',
    );
  });
});
