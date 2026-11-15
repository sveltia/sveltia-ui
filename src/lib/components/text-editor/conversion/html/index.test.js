import { describe, expect, it } from 'vitest';
import { HTML_EXPORT_MAP } from './export.js';
import { HTML_CODE_IMPORT_MAP, HTML_IMPORT_MAP } from './import-rules.js';
import { getHtmlConfig } from './index.js';
import { HTML_TASK_LIST_IMPORT_MAP } from './task-list.js';

describe('getHtmlConfig', () => {
  it('should include the export map and the import rules of the enabled features only', () => {
    expect(getHtmlConfig({ hasCodeBlock: false, hasTaskList: false })).toEqual({
      export: HTML_EXPORT_MAP,
      import: HTML_IMPORT_MAP,
    });
    expect(getHtmlConfig({ hasCodeBlock: true, hasTaskList: true })).toEqual({
      export: HTML_EXPORT_MAP,
      import: { ...HTML_IMPORT_MAP, ...HTML_CODE_IMPORT_MAP, ...HTML_TASK_LIST_IMPORT_MAP },
    });
    expect(getHtmlConfig({ hasCodeBlock: false, hasTaskList: true }).import).toHaveProperty(
      'input',
    );
    expect(getHtmlConfig({ hasCodeBlock: true, hasTaskList: false }).import).toHaveProperty('pre');
  });
});
