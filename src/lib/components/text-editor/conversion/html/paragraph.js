/**
 * Splitting of an exported paragraph around the elements a paragraph can’t hold, like a figure,
 * which the HTML parser would otherwise move out of it.
 */

import { isDOMTextNode, isHTMLElement } from 'lexical';
import { isPreformatted, TEXT_FORMAT_TAGS } from './utils.js';

/**
 * Elements a paragraph can’t hold: the HTML parser ends an open `<p>` before any of them.
 * @see https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inbody
 */
const PARAGRAPH_ENDING_TAGS = [
  ...['address', 'article', 'aside', 'blockquote', 'center', 'dd', 'details', 'dialog', 'dir'],
  ...['div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3'],
  ...['h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'li', 'listing', 'main', 'menu', 'nav', 'ol'],
  ...['p', 'plaintext', 'pre', 'search', 'section', 'summary', 'table', 'ul', 'xmp'],
];

/**
 * Check whether the given node is an element a paragraph can’t hold, like a `<figure>`.
 * @param {Node} node Node.
 * @returns {boolean} Result.
 */
const isParagraphEndingElement = (node) =>
  isHTMLElement(node) && PARAGRAPH_ENDING_TAGS.includes(node.localName);

/**
 * Find the first or last text node within the given node, or the node itself if it’s a text node.
 * @param {Node | undefined} node Node.
 * @param {boolean} forward Whether to look for the first text node rather than the last.
 * @returns {Text | undefined} Text node, if any.
 */
const findEdgeTextNode = (node, forward) => {
  let current = node ?? null;

  while (current && !isDOMTextNode(current)) {
    current = forward ? current.firstChild : current.lastChild;
  }

  return current ?? undefined;
};

/**
 * Names of the elements of the text formats, which hold nothing but text. See
 * {@link TEXT_FORMAT_TAGS}.
 */
const TEXT_FORMAT_TAG_NAMES = TEXT_FORMAT_TAGS.map(([, tagName]) => tagName);

/**
 * Check whether the given node is blank: text with nothing but whitespace, or the element of a text
 * format, like `<strong>`, holding only such text. Any other element, like an image, a line break
 * or a link, is content, even without any text.
 * @param {Node} node Node.
 * @returns {boolean} Result.
 */
const isBlank = (node) =>
  isDOMTextNode(node)
    ? !node.data.trim()
    : isHTMLElement(node) &&
      TEXT_FORMAT_TAG_NAMES.includes(node.localName) &&
      [...node.childNodes].every(isBlank);

/**
 * Split the given exported paragraph around the elements it can’t hold, like the `<figure>` an
 * inline editor component exports for an image with a caption: the HTML parser would end the `<p>`
 * before the first one, leaving the content after it in an empty paragraph. The rest of the content
 * stays in copies of the paragraph, which keep its alignment, while the whitespace next to such an
 * element is dropped, as the parser collapses it at the start and end of a paragraph.
 * @param {HTMLElement} paragraph Exported paragraph element.
 * @returns {DocumentFragment | undefined} Paragraphs and elements to replace the paragraph with,
 * or `undefined` if it holds no such element.
 */
export const splitParagraphAroundBlocks = (paragraph) => {
  const children = [...paragraph.childNodes];

  if (!children.some(isParagraphEndingElement)) {
    return undefined;
  }

  const fragment = document.createDocumentFragment();
  /** @type {ChildNode[]} */
  let run = [];

  /**
   * Add the content collected since the last block, if any, to the fragment in a new paragraph.
   */
  const flush = () => {
    const first = findEdgeTextNode(run[0], true);
    const last = findEdgeTextNode(run.at(-1), false);

    // Preformatted whitespace is imported as is, so it’s kept as well
    if (first && !isPreformatted(first)) {
      first.data = first.data.trimStart();
    }

    if (last && !isPreformatted(last)) {
      last.data = last.data.trimEnd();
    }

    if (!run.every(isBlank)) {
      const newParagraph = /** @type {HTMLElement} */ (paragraph.cloneNode(false));

      newParagraph.append(...run);
      fragment.append(newParagraph);
    }

    run = [];
  };

  children.forEach((child) => {
    if (isParagraphEndingElement(child)) {
      flush();
      fragment.append(child);
    } else {
      run.push(child);
    }
  });

  flush();

  return fragment;
};
