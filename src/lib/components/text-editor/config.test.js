import { describe, expect, it } from 'vitest';
import { getEditorSetup, normalizeConfig } from './config.js';

describe('normalizeConfig', () => {
  it('applies the defaults', () => {
    expect(normalizeConfig({ useMarkdownShortcuts: true })).toEqual({
      useMarkdownShortcuts: true,
      modes: [],
      enabledButtons: [],
      components: [],
      isCodeEditor: false,
      useEmojiAutocomplete: false,
      defaultLanguage: 'plain',
      format: 'markdown',
      multiline: true,
    });
  });

  it('keeps the given values', () => {
    const config = normalizeConfig({
      modes: ['plain-text'],
      enabledButtons: ['bold', 'table'],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      useEmojiAutocomplete: true,
      format: 'html',
    });

    expect(config.modes).toEqual(['plain-text']);
    expect(config.enabledButtons).toEqual(['bold', 'table']);
    expect(config.useMarkdownShortcuts).toBe(false);
    expect(config.useEmojiAutocomplete).toBe(true);
    expect(config.format).toBe('html');
  });

  it('limits a single-line editor to the inline features', () => {
    const config = normalizeConfig({
      modes: ['rich-text', 'plain-text'],
      enabledButtons: ['bold', 'table', 'heading-1'],
      format: 'html',
      multiline: false,
    });

    expect(config.enabledButtons).toEqual(['bold']);
    expect(config.modes).toEqual(['rich-text']);
  });

  it('gives an equal configuration when normalized again', () => {
    const config = normalizeConfig({ enabledButtons: ['bold', 'table'], multiline: false });

    expect(normalizeConfig(config)).toEqual(config);
  });
});

describe('getEditorSetup', () => {
  it('derives the features from the enabled buttons', () => {
    const setup = getEditorSetup(
      normalizeConfig({
        enabledButtons: ['code-block', 'table', 'horizontal-rule', 'link', 'task-list'],
      }),
    );

    expect(setup).toMatchObject({
      hasCodeBlock: true,
      hasTable: true,
      hasHorizontalRule: true,
      hasLink: true,
      hasTaskList: true,
      hasBlockSyntax: true,
    });
  });

  it('leaves out the features without their buttons', () => {
    expect(getEditorSetup(normalizeConfig({ enabledButtons: ['bold'] }))).toMatchObject({
      hasCodeBlock: false,
      hasTable: false,
      hasHorizontalRule: false,
      hasLink: false,
      hasTaskList: false,
      hasBlockSyntax: true,
    });
  });

  it('has code blocks but no block syntax in a code editor', () => {
    expect(
      getEditorSetup(normalizeConfig({ enabledButtons: ['table'], isCodeEditor: true })),
    ).toMatchObject({
      hasCodeBlock: true,
      hasTable: false,
      hasBlockSyntax: false,
    });
  });

  it('has no block syntax in a single-line editor', () => {
    expect(
      getEditorSetup(normalizeConfig({ enabledButtons: ['table'], multiline: false })),
    ).toMatchObject({
      hasTable: false,
      hasBlockSyntax: false,
      multiline: false,
    });
  });
});
