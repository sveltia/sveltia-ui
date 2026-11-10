import { findCodeSpans } from '../markdown.js';

/**
 * @import { TextFormatTransformer, TextMatchTransformer, Transformer } from '@lexical/markdown';
 * @import { TextNode } from 'lexical';
 */

/**
 * @typedef {object} Range
 * @property {number} start Start index.
 * @property {number} end End index, exclusive.
 */

/**
 * @typedef {object} Delimiter
 * @property {string} char Delimiter character.
 * @property {number} index Index of the remaining delimiter characters.
 * @property {number} length Number of the remaining delimiter characters.
 * @property {boolean} canOpen Whether the run can open emphasis.
 * @property {boolean} canClose Whether the run can close emphasis.
 * @property {boolean} active Whether the run can still be paired.
 */

/**
 * Whitespace, as Lexical reads it.
 */
const WHITESPACE = /\s/;
/**
 * ASCII punctuation, as Lexical reads it. Unlike CommonMark, Lexical leaves out the backslash.
 */
const PUNCTUATION = /[!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~]/;

/**
 * Check if the character at the given index is escaped with a backslash.
 * @param {string} text Text.
 * @param {number} index Index.
 * @returns {boolean} Result.
 */
const isEscaped = (text, index) => {
  let count = 0;

  while (text[index - count - 1] === '\\') {
    count += 1;
  }

  return count % 2 === 1;
};

/**
 * Check if a delimiter run is left-flanking or right-flanking, like Lexical does.
 * @param {string} text Text.
 * @param {number} index Index of the run.
 * @param {number} length Length of the run.
 * @param {boolean} isLeft Whether to check if it’s left-flanking.
 * @returns {boolean} Result.
 * @see https://spec.commonmark.org/0.31.2/#left-flanking-delimiter-run
 */
const isFlanking = (text, index, length, isLeft) => {
  const before = text[index - 1];
  const after = text[index + length];
  const [primary, secondary] = isLeft ? [after, before] : [before, after];

  if (primary === undefined || WHITESPACE.test(primary)) {
    return false;
  }

  return (
    !PUNCTUATION.test(primary) ||
    secondary === undefined ||
    WHITESPACE.test(secondary) ||
    PUNCTUATION.test(secondary)
  );
};

/**
 * Check if a delimiter run can open or close emphasis, like Lexical does.
 * @param {string} text Text.
 * @param {number} index Index of the run.
 * @param {number} length Length of the run.
 * @param {boolean} isOpen Whether to check if it can open emphasis.
 * @returns {boolean} Result.
 */
const canEmphasis = (text, index, length, isOpen) => {
  if (!isFlanking(text, index, length, isOpen)) {
    return false;
  }

  if (text[index] !== '_' || !isFlanking(text, index, length, !isOpen)) {
    return true;
  }

  const adjacent = isOpen ? text[index - 1] : text[index + length];

  return adjacent !== undefined && PUNCTUATION.test(adjacent);
};

/**
 * Find the delimiter runs outside code spans that can open or close emphasis, like Lexical does.
 * @param {string} text Text.
 * @param {Set<string>} chars Delimiter characters.
 * @param {Range[]} codeSpans Code spans.
 * @returns {Delimiter[]} Delimiter runs.
 */
const findDelimiters = (text, chars, codeSpans) => {
  /** @type {Delimiter[]} */
  const delimiters = [];
  let spanIndex = 0;
  let index = 0;

  while (index < text.length) {
    while (spanIndex < codeSpans.length && codeSpans[spanIndex].end <= index) {
      spanIndex += 1;
    }

    const char = text[index];
    const span = codeSpans[spanIndex];

    if (span && span.start <= index) {
      index = span.end;
    } else if (!chars.has(char) || isEscaped(text, index)) {
      index += 1;
    } else {
      let length = 1;

      while (text[index + length] === char) {
        length += 1;
      }

      const canOpen = canEmphasis(text, index, length, true);
      const canClose = canEmphasis(text, index, length, false);

      if (canOpen || canClose) {
        delimiters.push({ char, index, length, canOpen, canClose, active: true });
      }

      index += length;
    }
  }

  return delimiters;
};

/**
 * Pair the delimiter runs like Lexical does, following the CommonMark algorithm.
 * @param {Delimiter[]} delimiters Delimiter runs, which are updated as they’re paired.
 * @param {string[]} tags Delimiters of the text formats, like `**`.
 * @returns {Range[]} Emphasis, from the opening delimiters to the closing ones.
 * @see https://spec.commonmark.org/0.31.2/#process-emphasis
 */
const pairDelimiters = (delimiters, tags) => {
  /** @type {Record<string, number>} */
  const openersBottom = {};
  /** @type {Range[]} */
  const pairs = [];
  let position = 0;

  while (position < delimiters.length) {
    const closer = delimiters[position];

    if (!closer.active || !closer.canClose || !closer.length) {
      position += 1;
    } else {
      const bottomKey = `${closer.char}${closer.canOpen}${closer.length % 3}`;
      const bottom = openersBottom[bottomKey] ?? -1;
      let found = false;

      for (let openIndex = position - 1; openIndex > bottom && !found; openIndex -= 1) {
        const opener = delimiters[openIndex];

        const canPair =
          opener.active &&
          opener.canOpen &&
          opener.length > 0 &&
          opener.char === closer.char &&
          // The rule of 3
          !(
            (opener.canClose || closer.canOpen) &&
            (opener.length + closer.length) % 3 === 0 &&
            opener.length % 3 !== 0 &&
            closer.length % 3 !== 0
          );

        const maxLength = Math.min(opener.length, closer.length);

        const tag = canPair
          ? tags
              .filter((t) => t[0] === opener.char && t.length <= maxLength)
              .sort((a, b) => b.length - a.length)[0]
          : undefined;

        if (tag) {
          found = true;
          pairs.push({
            start: opener.index + opener.length - tag.length,
            end: closer.index + tag.length,
          });

          for (let index = openIndex + 1; index < position; index += 1) {
            delimiters[index].active = false;
          }

          opener.length -= tag.length;
          closer.length -= tag.length;
          opener.active = opener.length > 0;

          if (closer.length > 0) {
            closer.index += tag.length;
          } else {
            closer.active = false;
            position += 1;
          }
        }
      }

      if (!found) {
        openersBottom[bottomKey] = position - 1;
        closer.active = closer.canOpen;
        position += 1;
      }
    }
  }

  return pairs;
};

/**
 * Create a function that finds where a text node has to be split before Lexical imports it, so the
 * formatting around a code span isn’t lost; see `addCodeSpanSplit()`.
 * @param {string[]} tags Delimiters of the text formats other than code, like `**`.
 * @param {TextMatchTransformer[]} textMatchTransformers Text match transformers.
 * @returns {(text: string) => number | undefined} Function that returns the index to split the
 * text at, or `undefined` if it doesn’t have to be split.
 */
const createSplitIndexFinder = (tags, textMatchTransformers) => {
  const chars = new Set(tags.map((tag) => tag[0]));

  const regexes = textMatchTransformers.flatMap(({ importRegExp }) =>
    importRegExp
      ? [new RegExp(importRegExp.source, `${importRegExp.flags.replace('g', '')}g`)]
      : [],
  );

  /** @type {{ text: string, index: number | undefined } | undefined} */
  let cache;

  /**
   * Find the index to split the text at.
   * @param {string} text Text.
   * @returns {number | undefined} Index.
   */
  const findSplitIndex = (text) => {
    const codeSpans = findCodeSpans(text);
    const [code] = codeSpans;

    if (!code) {
      return undefined;
    }

    const pairs = pairDelimiters(findDelimiters(text, chars, codeSpans), tags);
    /**
     * Check if the given emphasis wraps the first code span.
     * @param {Range} pair Emphasis.
     * @returns {boolean} Result.
     */
    const wrapsCode = ({ start, end }) => start <= code.start && end >= code.end;
    // The emphasis Lexical imports first: the one that starts first, or the longest of those
    const [first] = [...pairs].sort((a, b) => a.start - b.start || b.end - a.end);

    if (!first || wrapsCode(first)) {
      return undefined;
    }

    // The outermost emphasis around the code span
    const [outer] = pairs.filter(wrapsCode).sort((a, b) => a.start - b.start);

    if (
      !outer ||
      // A text match, like a link, that the split would cut in two
      regexes.some((regex) =>
        [...text.matchAll(regex)].some(
          ({ 0: { length }, index }) => index < outer.start && index + length > outer.start,
        ),
      )
    ) {
      return undefined;
    }

    return outer.start;
  };

  return (text) => {
    if (cache?.text !== text) {
      cache = { text, index: findSplitIndex(text) };
    }

    return cache.index;
  };
};

/**
 * Add a transformer to the given ones that keeps the formatting around a code span when Lexical
 * imports it after other formatting or a link, like `` **`a`** `` in `` **b** **`a`** `` or
 * `` [**b**](u)**`a`** ``. Lexical takes a code span before the formatting, unless the formatting
 * it would take first wraps the code span, and that formatting is the one that starts first, like
 * `**b**`. So Lexical takes the code span, splitting the text around it, and the formatting around
 * the code span is lost, along with its delimiters, which are then escaped on export. The added
 * transformer splits the text where the formatting around the code span starts, so each part is
 * imported on its own. To find it, the delimiters are paired like Lexical does. Lexical only lets a
 * text match take precedence over the code span if it wraps the code span, so the text is matched
 * from there to its end. The other text match transformers are wrapped so they don’t match before
 * that point, as Lexical takes the text match that starts first; they match in the part before it
 * instead. The text isn’t split if it would cut a text match in two. It’s only for the import.
 * @param {Transformer[]} transformers Transformers.
 * @returns {Transformer[]} Transformers for the import.
 * @see https://spec.commonmark.org/0.31.2/#emphasis-and-strong-emphasis
 */
export const addCodeSpanSplit = (transformers) => {
  const tags = transformers
    .filter((transformer) => transformer.type === 'text-format')
    .map((transformer) => /** @type {TextFormatTransformer} */ (transformer).tag);

  if (!tags.includes('`')) {
    return transformers;
  }

  const findSplitIndex = createSplitIndexFinder(
    tags.filter((tag) => tag !== '`'),
    /** @type {TextMatchTransformer[]} */ (
      transformers.filter((transformer) => transformer.type === 'text-match')
    ),
  );

  /** @type {TextMatchTransformer} */
  const splitter = {
    dependencies: [],
    /**
     * Leave the export to the other transformers.
     * @returns {null} Nothing.
     */
    export: () => null,
    // Lexical matches the text with `String.prototype.match()`, which calls this method
    importRegExp: Object.assign(/(?!)/, {
      /**
       * Match the text from the index to split it at to its end.
       * @param {string} text Text.
       * @returns {RegExpMatchArray | null} Match.
       */
      [Symbol.match]: (text) => {
        const index = findSplitIndex(text);

        return index === undefined
          ? null
          : /** @type {RegExpMatchArray} */ (
              Object.assign([text.slice(index)], { index, input: text })
            );
      },
    }),
    regExp: /(?!)/,
    /**
     * Leave the part of the text from the split to Lexical, which imports it on its own.
     * @param {TextNode} node Text node with the matched text.
     * @returns {TextNode} Same node.
     */
    replace: (node) => node,
    type: 'text-match',
  };

  return [
    splitter,
    ...transformers.map((transformer) => {
      if (transformer.type !== 'text-match') {
        return transformer;
      }

      const { getEndIndex } = /** @type {TextMatchTransformer} */ (transformer);

      return {
        ...transformer,
        /**
         * Get the end index of a match, or `false` to skip it if it ends before the split.
         * @param {TextNode} node Text node.
         * @param {RegExpMatchArray} match Match.
         * @returns {number | false} End index or `false`.
         */
        getEndIndex: (node, match) => {
          const end = getEndIndex ? getEndIndex(node, match) : (match.index ?? 0) + match[0].length;
          const splitIndex = findSplitIndex(node.getTextContent());

          return end !== false && splitIndex !== undefined && end <= splitIndex ? false : end;
        },
      };
    }),
  ];
};
