import {
  $getNearestNodeFromDOMNode as getNearestNodeFromDOMNode,
  $getRoot as getRoot,
} from 'lexical';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { getEditorStore } from '../../../test-utils/editor.js';
import EditorFixture from '../editor-fixture.test.svelte';
import { $getTableCell as getTableCell } from '../table.js';
import TableActionMenu from './table-action-menu.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 * @import { TextEditorStore } from '#lib/typedefs.js';
 */

const TABLE = ['| A | B |', '| --- | --- |', '| 1 | 2 |'].join('\n');

/**
 * Render the menu for the cell with the given text, in a live editor holding a small table.
 * @param {object} [options] Options.
 * @param {string} [options.cellText] Text of the cell to open the menu for. If omitted, the menu
 * is opened for a cell that doesn’t exist.
 * @param {boolean} [options.rtl] Whether to lay out the editor from right to left.
 * @returns {Promise<{ screen: any, store: TextEditorStore, root: HTMLElement }>} Rendered fixture,
 * the store and the editor root.
 */
const renderMenu = async ({ cellText, rtl = false } = {}) => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    config: { enabledButtons: ['table'] },
    component: undefined,
    componentProps: { cellKey: 'missing' },
  });

  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);
  const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

  await vi.waitFor(() => {
    expect(store.initialized).toBe(true);
  });
  store.inputValue = TABLE;
  await vi.waitFor(() => {
    expect(root.querySelector('table')).not.toBeNull();
  });

  if (rtl) {
    store.editor?.update(() => {
      getRoot().setDirection('rtl');
    });
  }

  if (cellText) {
    const cell = /** @type {HTMLElement} */ (
      [...root.querySelectorAll('th, td')].find((element) => element.textContent === cellText)
    );

    props.componentProps = {
      cellKey: store.editor?.read(() => getTableCell(getNearestNodeFromDOMNode(cell))?.getKey()),
    };
  }

  props.component = TableActionMenu;

  return { screen, store, root };
};

describe('TableActionMenu', () => {
  it('inserts a column after the cell for Insert Column Left in a right-to-left table', async () => {
    const { screen, store } = await renderMenu({ cellText: 'A', rtl: true });

    await screen.getByRole('menuitem', { name: 'Insert Column Left' }).click();
    await vi.waitFor(() => {
      expect(store.inputValue).toBe(
        ['| A |  | B |', '| --- | --- | --- |', '| 1 |  | 2 |'].join('\n'),
      );
    });
  });

  it('inserts a column before the cell for Insert Column Left in a left-to-right table', async () => {
    const { screen, store } = await renderMenu({ cellText: 'A' });

    await screen.getByRole('menuitem', { name: 'Insert Column Left' }).click();
    await vi.waitFor(() => {
      expect(store.inputValue).toBe(
        ['|  | A | B |', '| --- | --- | --- |', '|  | 1 | 2 |'].join('\n'),
      );
    });
  });

  it('does nothing for a cell that is gone', async () => {
    const { screen, store, root } = await renderMenu();

    await screen.getByRole('menuitem', { name: 'Delete Table' }).click();
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(root);
    });
    expect(store.inputValue).toBe(TABLE);
  });
});
