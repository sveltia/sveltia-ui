/**
 * Links: the URL check, the link commands, and the helpers of the floating link editor.
 */

import {
  $isLinkNode as isLinkNode,
  LinkNode,
  TOGGLE_LINK_COMMAND,
  $toggleLink as toggleLink,
} from '@lexical/link';
import { createDOMRange } from '@lexical/selection';
import {
  $findMatchingParent as findMatchingParent,
  objectKlassEquals,
  $unwrapNode as unwrapNode,
} from '@lexical/utils';
import { isURL } from '@sveltia/utils/string';
import {
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_NORMAL,
  $createTextNode as createTextNode,
  $getSelection as getSelection,
  $insertNodes as insertNodes,
  $isElementNode as isElementNode,
  $isRangeSelection as isRangeSelection,
  $isTextNode as isTextNode,
  PASTE_COMMAND,
} from 'lexical';
import { mergeUnregisters } from '../utils.js';

/**
 * @import { LexicalEditor, RangeSelection } from 'lexical';
 * @import { LinkAttributes } from '@lexical/link';
 * @import { EmojiAnchorRect } from '#lib/typedefs.js';
 */

/**
 * Payload of `TOGGLE_LINK_COMMAND` with the URL and the link attributes, like `target`.
 * @typedef {LinkAttributes & { url: string }} LinkAttributesWithURL
 */

/**
 * URL schemes allowed in a link, the same as the ones Lexical renders as is.
 */
const SAFE_LINK_URL_SCHEMES = ['http', 'https', 'mailto', 'sms', 'tel'];

/**
 * Whether the given URL is safe to be used as a link, meaning it’s either relative or uses one of
 * the {@link SAFE_LINK_URL_SCHEMES}. This keeps a URL like `javascript:alert(1)` out of the
 * Markdown, where the site that renders it may not sanitize it.
 * @param {string} url URL.
 * @returns {boolean} Result.
 */
export const isSafeLinkURL = (url) => {
  // Browsers ignore control characters and spaces around a URL as well as tabs and newlines within
  // it, e.g. `java\tscript:`, so strip them all before looking for the scheme
  // eslint-disable-next-line no-control-regex
  const normalizedURL = url.replace(/[\u0000-\u0020]/g, '');

  // Markdown decodes character references and backslash escapes in a link destination, so a scheme
  // can be hidden with them, e.g. `&#106;avascript:`, `javascript&colon;` or `javascript\:`. Reject
  // any of them before the path, query or fragment.
  if (/^[^/?#]*[&\\]/.test(normalizedURL)) {
    return false;
  }

  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(normalizedURL)?.[1];

  return !scheme || SAFE_LINK_URL_SCHEMES.includes(scheme.toLowerCase());
};

/**
 * Register the link command, the paste handler that turns a pasted URL into a link, and the
 * transform that removes a link with an unsafe URL.
 * @param {LexicalEditor} editor Editor instance.
 * @returns {() => void} Cleanup handler.
 * @see https://github.com/facebook/lexical/blob/main/packages/lexical-link/src/LexicalLinkExtension.ts
 */
export const registerLinkCommands = (editor) =>
  mergeUnregisters(
    // A link can also be created by importing the value or pasting rich text, which bypass the
    // command below. Unwrap a link with an unsafe URL, keeping its text, so the URL never reaches
    // the Markdown or HTML value
    editor.registerNodeTransform(LinkNode, (node) => {
      if (!isSafeLinkURL(node.getURL())) {
        unwrapNode(node);
      }
    }),
    editor.registerCommand(
      TOGGLE_LINK_COMMAND,
      (payload) => {
        // The payload is the URL, or an object with the URL and attributes like `target`
        const url = typeof payload === 'string' ? payload : (payload?.url ?? null);

        // Ignore an unsafe URL rather than linking to it
        if (url !== null && !isSafeLinkURL(url)) {
          return true;
        }

        toggleLink(url === null ? null : /** @type {string | LinkAttributesWithURL} */ (payload));

        return true;
      },
      COMMAND_PRIORITY_NORMAL,
    ),
    editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        const selection = getSelection();

        if (
          !isRangeSelection(selection) ||
          !objectKlassEquals(event, ClipboardEvent) ||
          !event.clipboardData ||
          /** @type {HTMLElement} */ (event.target).matches('input, textarea')
        ) {
          return false;
        }

        const clipboardText = event.clipboardData.getData('text').trim();

        // Paste an unsafe URL as plain text rather than as a link
        if (!isURL(clipboardText) || !isSafeLinkURL(clipboardText)) {
          return false;
        }

        if (selection.isCollapsed()) {
          insertNodes([createTextNode(clipboardText)]);
        }

        if (
          !selection
            .getNodes()
            .some((node) => isElementNode(node) || (isTextNode(node) && !node.isSimpleText()))
        ) {
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, clipboardText);
          event.preventDefault();
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_LOW,
    ),
  );

/**
 * Find the link that contains the whole selection. This must be called within an editor state
 * read.
 * @returns {LinkNode | null} Link, if any.
 */
export const $findSelectedLink = () => {
  const selection = getSelection();

  if (!isRangeSelection(selection)) {
    return null;
  }

  const link = findMatchingParent(selection.anchor.getNode(), isLinkNode);

  return link && findMatchingParent(selection.focus.getNode(), isLinkNode) === link
    ? /** @type {LinkNode} */ (link)
    : null;
};

/**
 * Get the viewport-relative bounds of the given selection.
 * @param {LexicalEditor} editor Editor instance.
 * @param {RangeSelection} selection Selection, which may come from an earlier editor state.
 * @returns {DOMRect | undefined} Bounds, or `undefined` if the selected nodes are gone.
 */
const getSelectionRect = (editor, selection) => {
  /** @type {DOMRect | undefined} */
  let rect;

  editor.getEditorState().read(() => {
    const [start, end] = selection.isBackward()
      ? [selection.focus, selection.anchor]
      : [selection.anchor, selection.focus];

    // The selected nodes may be gone, e.g. after an undo
    /* v8 ignore else */
    if (start.getNode().isAttached() && end.getNode().isAttached()) {
      rect = createDOMRange(
        editor,
        start.getNode(),
        start.offset,
        end.getNode(),
        end.offset,
      )?.getBoundingClientRect();
    }
  });

  return rect;
};

/**
 * Get the viewport-relative bounds of what the link editor is anchored to: the selected text to be
 * linked, or a link.
 * @param {LexicalEditor} editor Editor instance.
 * @param {{ selection: RangeSelection } | { linkKey: string | undefined }} target Selected text,
 * or the key of the link.
 * @returns {EmojiAnchorRect | undefined} Bounds, or `undefined` if they can’t be determined.
 */
export const getLinkAnchorRect = (editor, target) => {
  const rect =
    'selection' in target
      ? getSelectionRect(editor, target.selection)
      : target.linkKey
        ? editor.getElementByKey(target.linkKey)?.getBoundingClientRect()
        : undefined;

  // The link or text may not be laid out, e.g. while the editor is hidden
  /* v8 ignore next */
  if (!rect || !(rect.top || rect.bottom || rect.left || rect.width || rect.height)) {
    return undefined;
  }

  const { top, bottom, left, right } = rect;

  return { top, bottom, left, right };
};
