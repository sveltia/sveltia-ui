/* eslint-disable jsdoc/require-jsdoc */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  /** @type {any[]} */ children: [],
  isCodeNode: true,
}));

vi.mock('@lexical/code-core', () => ({
  $isCodeNode: vi.fn(() => mockState.isCodeNode),
}));

vi.mock('lexical', () => ({
  $getRoot: vi.fn(() => ({
    getChildren: () => mockState.children,
  })),
  HISTORY_MERGE_TAG: 'history-merge',
}));

// eslint-disable-next-line import/first
import { CODE_THEME_DARK, CODE_THEME_LIGHT, getCodeTheme, observeCodeTheme } from './theme.js';

/**
 * Build a fake code node.
 * @param {string} [theme] Current theme.
 * @returns {any} Fake node.
 */
const createNode = (theme = CODE_THEME_LIGHT) => {
  let current = theme;

  return {
    getTheme: () => current,
    setTheme: vi.fn((value) => {
      current = value;
    }),
    markDirty: vi.fn(),
  };
};

/**
 * Build a fake editor that runs updates synchronously.
 * @returns {any} Fake editor.
 */
const createEditor = () => ({ update: vi.fn((callback) => callback()) });

describe('shiki theme', () => {
  beforeEach(() => {
    mockState.children = [];
    mockState.isCodeNode = true;
    delete document.documentElement.dataset.theme;
    vi.clearAllMocks();

    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
  });

  it('follows an explicit dark appearance', () => {
    document.documentElement.dataset.theme = 'dark';
    expect(getCodeTheme()).toBe(CODE_THEME_DARK);
  });

  it('follows an explicit light appearance', () => {
    document.documentElement.dataset.theme = 'light';
    expect(getCodeTheme()).toBe(CODE_THEME_LIGHT);
  });

  it('falls back to the system appearance', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );

    expect(getCodeTheme()).toBe(CODE_THEME_DARK);
  });

  it('re-themes every code block when the appearance changes', async () => {
    document.documentElement.dataset.theme = 'light';

    const node = createNode(CODE_THEME_LIGHT);

    mockState.children = [node];

    const editor = createEditor();
    const dispose = observeCodeTheme(editor);

    document.documentElement.dataset.theme = 'dark';
    // Let the mutation observer fire
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(node.setTheme).toHaveBeenCalledWith(CODE_THEME_DARK);
    expect(node.markDirty).toHaveBeenCalled();

    dispose();
  });

  it('leaves blocks alone when the theme has not actually changed', async () => {
    document.documentElement.dataset.theme = 'light';

    const node = createNode(CODE_THEME_LIGHT);

    mockState.children = [node];

    const editor = createEditor();
    const dispose = observeCodeTheme(editor);

    // A `data-theme` write that resolves to the same Shiki theme
    document.documentElement.dataset.theme = 'light';

    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(node.setTheme).not.toHaveBeenCalled();

    dispose();
  });

  it('stops listening once disposed', async () => {
    document.documentElement.dataset.theme = 'light';

    const node = createNode(CODE_THEME_LIGHT);

    mockState.children = [node];

    const dispose = observeCodeTheme(createEditor());

    dispose();
    document.documentElement.dataset.theme = 'dark';

    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(node.setTheme).not.toHaveBeenCalled();
  });
});
