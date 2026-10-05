import { afterEach, describe, expect, it } from 'vitest';
import { getBackgroundUpdateTags } from './background-update.js';

/**
 * Create an editor stub with the given root element.
 * @param {HTMLElement | null} root Root element.
 * @returns {any} Editor.
 */
const createEditor = (root) => ({
  /**
   * Get the root element.
   * @returns {HTMLElement | null} Root element.
   */
  getRootElement: () => root,
});

describe('getBackgroundUpdateTags()', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('returns the other tags while the editor has the focus', () => {
    const root = document.createElement('div');

    root.contentEditable = 'true';
    document.body.append(root);
    root.focus();

    expect(getBackgroundUpdateTags(createEditor(root), ['history-merge'])).toEqual([
      'history-merge',
    ]);
    expect(getBackgroundUpdateTags(createEditor(root))).toEqual([]);
  });

  it('skips the DOM selection while the focus is elsewhere', () => {
    const root = document.createElement('div');
    const input = document.createElement('input');

    root.contentEditable = 'true';
    document.body.append(root, input);
    input.focus();

    expect(getBackgroundUpdateTags(createEditor(root), ['history-merge'])).toEqual([
      'history-merge',
      'skip-dom-selection',
    ]);
  });

  it('skips the DOM selection of an editor without a root element', () => {
    expect(getBackgroundUpdateTags(createEditor(null))).toEqual(['skip-dom-selection']);
  });
});
