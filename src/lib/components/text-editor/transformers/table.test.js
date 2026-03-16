import { describe, expect, it } from 'vitest';
import { TABLE } from './table.js';

describe('TABLE transformer', () => {
  it('should have the correct type', () => {
    expect(TABLE.type).toBe('element');
  });

  it('should have TableNode, TableRowNode, and TableCellNode in dependencies', () => {
    expect(TABLE.dependencies).toHaveLength(3);
  });

  it('regExp should match a table row line', () => {
    expect(TABLE.regExp.test('| foo | bar |')).toBe(true);
    expect(TABLE.regExp.test('| single |')).toBe(true);
  });

  it('regExp should not match lines without pipe borders', () => {
    expect(TABLE.regExp.test('foo bar')).toBe(false);
    expect(TABLE.regExp.test('- item')).toBe(false);
  });

  it('export should return null for a non-table node', () => {
    const fakeNode = { __type: 'paragraph' };

    expect(TABLE.export(/** @type {any} */ (fakeNode), () => '')).toBeNull();
  });
});
