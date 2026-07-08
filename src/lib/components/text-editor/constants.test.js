import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
} from '@lexical/markdown';
import { describe, expect, it } from 'vitest';
import {
  AVAILABLE_BUTTONS,
  BLOCK_BUTTON_TYPES,
  DISABLED_MARKDOWN_TAGS,
  IMAGE_COMPONENT_IDS,
  INLINE_BUTTON_TYPES,
  TEXT_FORMAT_BUTTON_TYPES,
  TRANSFORMER_MAP,
} from './constants.js';

describe('AVAILABLE_BUTTONS', () => {
  it('should contain all expected button keys', () => {
    const expectedKeys = [
      'bold',
      'italic',
      'strikethrough',
      'code',
      'link',
      'paragraph',
      'heading-1',
      'heading-2',
      'heading-3',
      'heading-4',
      'heading-5',
      'heading-6',
      'bulleted-list',
      'numbered-list',
      'blockquote',
      'code-block',
    ];

    expectedKeys.forEach((key) => {
      expect(AVAILABLE_BUTTONS).toHaveProperty(key);
    });
  });

  it('should mark inline buttons correctly', () => {
    expect(AVAILABLE_BUTTONS.bold.inline).toBe(true);
    expect(AVAILABLE_BUTTONS.italic.inline).toBe(true);
    expect(AVAILABLE_BUTTONS.link.inline).toBe(true);
    expect(AVAILABLE_BUTTONS.paragraph.inline).toBe(false);
    expect(AVAILABLE_BUTTONS['heading-1'].inline).toBe(false);
  });

  it('should have a labelKey and icon for each button', () => {
    Object.values(AVAILABLE_BUTTONS).forEach(({ labelKey, icon }) => {
      expect(typeof labelKey).toBe('string');
      expect(labelKey.length).toBeGreaterThan(0);
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThan(0);
    });
  });
});

describe('TEXT_FORMAT_BUTTON_TYPES', () => {
  it('should include bold, italic, strikethrough, code', () => {
    expect(TEXT_FORMAT_BUTTON_TYPES).toEqual(['bold', 'italic', 'strikethrough', 'code']);
  });
});

describe('INLINE_BUTTON_TYPES', () => {
  it('should include all text format types plus link', () => {
    expect(INLINE_BUTTON_TYPES).toContain('bold');
    expect(INLINE_BUTTON_TYPES).toContain('italic');
    expect(INLINE_BUTTON_TYPES).toContain('strikethrough');
    expect(INLINE_BUTTON_TYPES).toContain('code');
    expect(INLINE_BUTTON_TYPES).toContain('link');
  });

  it('should be a superset of TEXT_FORMAT_BUTTON_TYPES', () => {
    TEXT_FORMAT_BUTTON_TYPES.forEach((type) => {
      expect(INLINE_BUTTON_TYPES).toContain(type);
    });
  });
});

describe('BLOCK_BUTTON_TYPES', () => {
  it('should include paragraph and all heading levels', () => {
    expect(BLOCK_BUTTON_TYPES).toContain('paragraph');

    for (let i = 1; i <= 6; i += 1) {
      expect(BLOCK_BUTTON_TYPES).toContain(`heading-${i}`);
    }
  });

  it('should include list, blockquote, and code-block types', () => {
    expect(BLOCK_BUTTON_TYPES).toContain('bulleted-list');
    expect(BLOCK_BUTTON_TYPES).toContain('numbered-list');
    expect(BLOCK_BUTTON_TYPES).toContain('blockquote');
    expect(BLOCK_BUTTON_TYPES).toContain('code-block');
  });
});

describe('IMAGE_COMPONENT_IDS', () => {
  it('should include image and linked-image', () => {
    expect(IMAGE_COMPONENT_IDS).toContain('image');
    expect(IMAGE_COMPONENT_IDS).toContain('linked-image');
  });
});

describe('TRANSFORMER_MAP', () => {
  it('should include all expected transformers for bold', () => {
    expect(TRANSFORMER_MAP.bold).toEqual([
      BOLD_STAR,
      BOLD_UNDERSCORE,
      BOLD_ITALIC_STAR,
      BOLD_ITALIC_UNDERSCORE,
    ]);
  });

  it('should include all expected transformers for italic', () => {
    expect(TRANSFORMER_MAP.italic).toEqual([
      ITALIC_UNDERSCORE,
      ITALIC_STAR,
      BOLD_ITALIC_STAR,
      BOLD_ITALIC_UNDERSCORE,
    ]);
  });

  it('should include strikethrough transformer', () => {
    expect(TRANSFORMER_MAP.strikethrough).toEqual([STRIKETHROUGH]);
  });

  it('should include code transformer', () => {
    expect(TRANSFORMER_MAP.code).toEqual([INLINE_CODE]);
  });

  it('should have entries for all text format button types', () => {
    TEXT_FORMAT_BUTTON_TYPES.forEach((type) => {
      expect(TRANSFORMER_MAP).toHaveProperty(type);
      expect(Array.isArray(TRANSFORMER_MAP[type])).toBe(true);
      expect(TRANSFORMER_MAP[type].length).toBeGreaterThan(0);
    });
  });
});

describe('DISABLED_MARKDOWN_TAGS', () => {
  it('should be an array containing all disabled markdown tags', () => {
    expect(Array.isArray(DISABLED_MARKDOWN_TAGS)).toBe(true);
    expect(DISABLED_MARKDOWN_TAGS).toEqual(['*', '__', '***', '___']);
  });

  it('should disable ITALIC_STAR tag for Lexical-to-Markdown conversion', () => {
    expect(DISABLED_MARKDOWN_TAGS).toContain('*');
  });

  it('should disable BOLD_UNDERSCORE tag for Lexical-to-Markdown conversion', () => {
    expect(DISABLED_MARKDOWN_TAGS).toContain('__');
  });

  it('should disable BOLD_ITALIC_STAR tag for Lexical-to-Markdown conversion', () => {
    expect(DISABLED_MARKDOWN_TAGS).toContain('***');
  });

  it('should disable BOLD_ITALIC_UNDERSCORE tag for Lexical-to-Markdown conversion', () => {
    expect(DISABLED_MARKDOWN_TAGS).toContain('___');
  });
});
