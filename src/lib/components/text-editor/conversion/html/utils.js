/**
 * Helpers and constants shared by the HTML import and export.
 */

/**
 * Check if the given node is within a `<pre>` element or an element with preformatted whitespace,
 * whose text is imported by Lexical’s own conversion as is.
 * @param {Node} node Node.
 * @returns {boolean} Result.
 */
export const isPreformatted = (node) => {
  for (let element = node.parentElement; element; element = element.parentElement) {
    if (element.localName === 'pre' || element.style.whiteSpace.startsWith('pre')) {
      return true;
    }
  }

  return false;
};

/**
 * Text formats and their HTML tags, from the innermost to the outermost.
 * @type {[import('lexical').TextFormatType, string][]}
 */
export const TEXT_FORMAT_TAGS = [
  ['code', 'code'],
  ['subscript', 'sub'],
  ['superscript', 'sup'],
  ['highlight', 'mark'],
  ['underline', 'u'],
  ['strikethrough', 's'],
  ['italic', 'em'],
  ['bold', 'strong'],
];
