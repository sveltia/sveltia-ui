// cSpell:ignore-words horizontalrule

import { describe, expect, it, vi } from 'vitest';
import { HR } from './hr.js';

// Mock @lexical/extension so we can call HR.replace without a real Lexical editor context
vi.mock('@lexical/extension', () => {
  const mockHRNode = {
    __type: 'horizontalrule',
    // eslint-disable-next-line jsdoc/require-jsdoc
    selectNext: vi.fn(),
  };

  return {
    // eslint-disable-next-line jsdoc/require-jsdoc
    $createHorizontalRuleNode: vi.fn(() => mockHRNode),
    // eslint-disable-next-line jsdoc/require-jsdoc
    $isHorizontalRuleNode: (/** @type {{ __type: string; }} */ node) =>
      node?.__type === 'horizontalrule',
    /**
     *
     */
    HorizontalRuleNode: class {},
  };
});

describe('HR transformer', () => {
  it('should have the correct type', () => {
    expect(HR.type).toBe('element');
  });

  it('should include HorizontalRuleNode in dependencies', () => {
    expect(HR.dependencies).toHaveLength(1);
  });

  it('regExp should match --- divider', () => {
    expect(HR.regExp.test('---')).toBe(true);
  });

  it('regExp should match *** divider', () => {
    expect(HR.regExp.test('***')).toBe(true);
  });

  it('regExp should match ___ divider', () => {
    expect(HR.regExp.test('___')).toBe(true);
  });

  it('regExp should match dividers with trailing space', () => {
    expect(HR.regExp.test('--- ')).toBe(true);
    expect(HR.regExp.test('*** ')).toBe(true);
  });

  it('regExp should not match partial dividers', () => {
    expect(HR.regExp.test('--')).toBe(false);
    expect(HR.regExp.test('**')).toBe(false);
    expect(HR.regExp.test('__')).toBe(false);
  });

  it('export should return null for a non-HR node', () => {
    const fakeNode = { __type: 'paragraph' };

    expect(HR.export(/** @type {any} */ (fakeNode), () => '')).toBeNull();
  });

  it('export should return "***" for an HR node', () => {
    const hrNode = { __type: 'horizontalrule' };

    expect(HR.export(/** @type {any} */ (hrNode), () => '')).toBe('***');
  });

  it('replace should call parentNode.replace when isImport is true', () => {
    const parentNode = {
      replace: vi.fn(),
      insertBefore: vi.fn(),
      getNextSibling: vi.fn().mockReturnValue(null),
    };

    HR.replace(/** @type {any} */ (parentNode), [], /** @type {any} */ (['---']), true);
    expect(parentNode.replace).toHaveBeenCalledOnce();
    expect(parentNode.insertBefore).not.toHaveBeenCalled();
  });

  it('replace should call parentNode.replace when there is a next sibling', () => {
    const siblingNode = { __type: 'paragraph' };

    const parentNode = {
      replace: vi.fn(),
      insertBefore: vi.fn(),
      getNextSibling: vi.fn().mockReturnValue(siblingNode),
    };

    HR.replace(/** @type {any} */ (parentNode), [], /** @type {any} */ (['---']), false);
    expect(parentNode.replace).toHaveBeenCalledOnce();
    expect(parentNode.insertBefore).not.toHaveBeenCalled();
  });

  it('replace should call parentNode.insertBefore when not import and no next sibling', () => {
    const parentNode = {
      replace: vi.fn(),
      insertBefore: vi.fn(),
      getNextSibling: vi.fn().mockReturnValue(null),
    };

    HR.replace(/** @type {any} */ (parentNode), [], /** @type {any} */ (['---']), false);
    expect(parentNode.insertBefore).toHaveBeenCalledOnce();
    expect(parentNode.replace).not.toHaveBeenCalled();
  });
});
