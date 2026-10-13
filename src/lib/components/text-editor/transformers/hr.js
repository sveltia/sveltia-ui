// Adopted from https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/MarkdownTransformers/index.ts

/* eslint-disable jsdoc/require-jsdoc */

import {
  $createHorizontalRuleNode as createHorizontalRuleNode,
  HorizontalRuleNode,
  $isHorizontalRuleNode as isHorizontalRuleNode,
} from '@lexical/extension';

/**
 * @import { ElementTransformer } from '@lexical/markdown';
 */

/**
 * Markdown of a horizontal rule. Unlike `---`, it can’t be taken for the underline of a setext
 * heading or the delimiter of front matter.
 */
export const HORIZONTAL_RULE_MARKDOWN = '***';

/**
 * @type {ElementTransformer}
 */
export const HR = {
  dependencies: [HorizontalRuleNode],
  export: (node) => (isHorizontalRuleNode(node) ? HORIZONTAL_RULE_MARKDOWN : null),
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode, _1, _2, isImport) => {
    const line = createHorizontalRuleNode();

    if (isImport || parentNode.getNextSibling() !== null) {
      parentNode.replace(line);
    } else {
      parentNode.insertBefore(line);
    }

    line.selectNext();
  },
  type: 'element',
};
