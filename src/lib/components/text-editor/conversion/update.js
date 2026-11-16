/**
 * Exporting the editor content, and passing it on as it changes.
 */

import { $convertToMarkdownString as convertToMarkdownString } from '@lexical/markdown';
import { sleep } from '@sveltia/utils/misc';
import { DISABLED_MARKDOWN_TAGS } from '../constants.js';
import { exportHtml } from './html/index.js';
import { trimBlankBlockquoteLines } from './markdown/index.js';
import { BLOCK_SYNTAX_ESCAPE } from './transformers/block-escape.js';
import { getSelectionTypes } from '../editing/selection.js';
import { mergeUnregisters } from '../utils.js';

/**
 * @import { LexicalEditor } from 'lexical';
 * @import { Transformer } from '@lexical/markdown';
 * @import { TextEditorSelectionState, TextEditorValueFormat } from '#lib/typedefs.js';
 */

/**
 * Value exported from the editor, and the selection state at the time.
 * @typedef {object} ExportDetail
 * @property {string} value Markdown or HTML value.
 * @property {TextEditorSelectionState} selection Selection state.
 */

/**
 * Convert the editor content to Markdown. Call this within an editor update or read.
 * @internal
 * @param {Transformer[]} enabledTransformers Enabled Markdown transformers.
 * @returns {string} Markdown value.
 */
export const exportMarkdown = (enabledTransformers) => {
  const transformers = [
    ...enabledTransformers.filter(
      (/** @type {any} */ { tag }) => !DISABLED_MARKDOWN_TAGS.includes(tag),
    ),
    // Tidy up the escapes in text and escape the block syntax at the start of a line. Last, so a
    // transformer of the editor’s own, such as a link, comes first
    BLOCK_SYNTAX_ESCAPE,
  ];

  return trimBlankBlockquoteLines(
    convertToMarkdownString(transformers)
      // Remove the line breaks left by empty paragraphs at the end, which have no content. One
      // may be added just by clicking below a block decorator; see `$moveCaretIntoBlock()`
      .replace(/\n+$/, ''),
  );
};

/**
 * Export the editor content as Markdown or HTML. Call this within an editor update or read.
 * @internal
 * @param {LexicalEditor} editor Editor instance.
 * @param {Transformer[]} enabledTransformers Enabled Markdown transformers.
 * @param {TextEditorValueFormat} [format] Value format.
 * @returns {string} Markdown or HTML value.
 */
export const exportValue = (editor, enabledTransformers, format = 'markdown') =>
  format === 'html' ? exportHtml(editor) : exportMarkdown(enabledTransformers);

/**
 * Register an update listener that exports the editor content as Markdown or HTML, and passes it
 * on along with the selection state, debounced so only the latest update in a burst is exported.
 * @param {LexicalEditor} editor Editor instance.
 * @param {Transformer[]} enabledTransformers Enabled Markdown transformers.
 * @param {TextEditorValueFormat} format Value format.
 * @param {(detail: ExportDetail) => void} onExport Function to call with the exported value. It’s
 * called within an editor update.
 * @returns {{ flush: () => void, unregister: () => void }} `flush` exports the content scheduled
 * to be exported right away, instead of after the delay, so the value reflects what was just
 * typed. Call it before acting on the value, like when the focus leaves the editor or before
 * switching to the Markdown or HTML source. It does nothing if nothing is scheduled. `unregister`
 * removes the listener.
 */
export const registerValueExport = (editor, enabledTransformers, format, onExport) => {
  /** Incremented on every update, so only the latest one in a burst is exported. */
  let updateCount = 0;
  /** Whether the content has changed since it was last exported. */
  let contentChanged = true;
  /** @type {string | undefined} */
  let lastValue = undefined;
  let disposed = false;
  /** Whether an export is scheduled, and hasn’t been made yet. */
  let scheduled = false;

  /**
   * Export the current value, and pass it on.
   */
  const triggerExport = () => {
    scheduled = false;

    editor.update(() => {
      // Reuse the value when only the selection has changed, instead of converting the whole
      // document again
      const value =
        (contentChanged ? undefined : lastValue) ??
        exportValue(editor, enabledTransformers, format);

      onExport({ value, selection: getSelectionTypes() });
      lastValue = value;
      contentChanged = false;
    });
  };

  /**
   * Export the scheduled value right away.
   */
  const flush = () => {
    if (scheduled && !disposed && !editor.isComposing()) {
      triggerExport();
    }
  };

  const unregister = mergeUnregisters(
    () => {
      disposed = true;
    },
    editor.registerUpdateListener(({ dirtyElements, dirtyLeaves } = /** @type {any} */ ({})) => {
      // An update that only moves the selection leaves no dirty nodes. Remember whether any update
      // in the burst changed the content, so the document is only converted again when needed.
      // This includes the updates made while composing, which are otherwise skipped.
      contentChanged ||= !dirtyElements || dirtyElements.size > 0 || dirtyLeaves.size > 0;

      if (editor?.isComposing()) {
        return;
      }

      updateCount += 1;
      scheduled = true;

      const currentCount = updateCount;

      (async () => {
        await sleep(100);

        // Skip if a newer update has been made in the meantime, the value has been exported
        // already with `flush()`, or the editor has been disposed
        if (currentCount !== updateCount || !scheduled || disposed) {
          return;
        }

        triggerExport();
      })();
    }),
  );

  return { flush, unregister };
};
