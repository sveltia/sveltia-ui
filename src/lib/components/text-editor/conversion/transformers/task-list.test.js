import { CHECK_LIST } from '@lexical/markdown';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TASK_LIST } from './task-list.js';

/**
 * Get the match of the transformer for the given line.
 * @param {string} line Line.
 * @returns {string[]} Match.
 */
const match = (line) => /** @type {string[]} */ (line.match(TASK_LIST.regExp));

describe('TASK_LIST', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should match and export like Lexical’s `CHECK_LIST`', () => {
    expect(TASK_LIST.regExp).toBe(CHECK_LIST.regExp);
    expect(TASK_LIST.export).toBe(CHECK_LIST.export);
  });

  it.each(['- [ ] item', '* [x] item', '+ [X] item', '  - [ ] nested', '-  [x] item'])(
    'should import `%s` as a task list item',
    (line) => {
      const replace = vi.spyOn(CHECK_LIST, 'replace').mockReturnValue(undefined);
      const parent = /** @type {any} */ ({});
      const lineMatch = match(line);

      expect(TASK_LIST.replace(parent, [], lineMatch, true)).toBeUndefined();
      expect(replace).toHaveBeenCalledWith(parent, [], lineMatch, true);
    },
  );

  it.each(['[x] Agreed', '[ ] Pending', '[] Empty', '- [] Empty'])(
    'should leave `%s` to the other transformers on import',
    (line) => {
      const replace = vi.spyOn(CHECK_LIST, 'replace');
      const lineMatch = match(line);

      expect(lineMatch).not.toBeNull();
      expect(TASK_LIST.replace(/** @type {any} */ ({}), [], lineMatch, true)).toBe(false);
      expect(replace).not.toHaveBeenCalled();
    },
  );

  it('should keep the Markdown shortcut without a list marker, like typing `[ ] `', () => {
    const replace = vi.spyOn(CHECK_LIST, 'replace').mockReturnValue(undefined);

    TASK_LIST.replace(/** @type {any} */ ({}), [], match('[ ] '), false);
    expect(replace).toHaveBeenCalled();
  });
});
