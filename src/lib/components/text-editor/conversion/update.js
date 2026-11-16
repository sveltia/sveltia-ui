/**
 * Exporting the editor content, and the Update event fired on changes.
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
 * @import { TextEditorValueFormat } from '#lib/typedefs.js';
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
 * Listen to changes made on the editor and trigger the Update event.
 * @internal
 * @param {LexicalEditor} editor Editor instance.
 * @param {Transformer[]} enabledTransformers Enabled Markdown transformers.
 * @param {string} [cachedValue] Value from a previous call, to be reused instead of converting the
 * whole document again when only the selection has changed.
 * @param {TextEditorValueFormat} [format] Value format.
 * @returns {string} Markdown or HTML value.
 */
export const onEditorUpdate = (editor, enabledTransformers, cachedValue, format = 'markdown') => {
  const value =
    cachedValue ?? (format === 'html' ? exportHtml(editor) : exportMarkdown(enabledTransformers));

  editor.getRootElement()?.dispatchEvent(
    new CustomEvent('Update', {
      detail: {
        value,
        selection: getSelectionTypes(),
      },
    }),
  );

  return value;
};

/**
 * Functions triggering the Update event an editor has scheduled, keyed by the editor.
 * @type {WeakMap<LexicalEditor, () => void>}
 */
const flushers = new WeakMap();

/**
 * Trigger the Update event the given editor has scheduled right away, instead of after the delay,
 * so the value reflects what was just typed. Call this before acting on the value, like when the
 * focus leaves the editor or before switching to the Markdown or HTML source. Does nothing if no
 * Update event is scheduled.
 * @param {LexicalEditor | undefined} editor Editor instance.
 */
export const flushUpdateEvent = (editor) => {
  if (editor) {
    flushers.get(editor)?.();
  }
};

/**
 * Register an update listener that triggers the Update event with the Markdown or HTML value,
 * debounced so only the latest update in a burst triggers it. See also {@link flushUpdateEvent}.
 * @param {LexicalEditor} editor Editor instance.
 * @param {Transformer[]} enabledTransformers Enabled Markdown transformers.
 * @param {TextEditorValueFormat} format Value format.
 * @returns {() => void} Cleanup handler.
 */
export const registerUpdateEvent = (editor, enabledTransformers, format) => {
  /** Incremented on every update, so only the latest one in a burst triggers the Update event. */
  let updateCount = 0;
  /** Whether the content has changed since the Update event was last triggered. */
  let contentChanged = true;
  /** @type {string | undefined} */
  let lastValue = undefined;
  let disposed = false;
  /** Whether the Update event is scheduled, and hasn’t been triggered yet. */
  let scheduled = false;

  /**
   * Trigger the Update event with the current value.
   */
  const triggerUpdate = () => {
    scheduled = false;

    editor.update(() => {
      lastValue = onEditorUpdate(
        editor,
        enabledTransformers,
        contentChanged ? undefined : lastValue,
        format,
      );
      contentChanged = false;
    });
  };

  flushers.set(editor, () => {
    if (scheduled && !disposed && !editor.isComposing()) {
      triggerUpdate();
    }
  });

  return mergeUnregisters(
    () => {
      disposed = true;
      flushers.delete(editor);
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

        // Skip if a newer update has been made in the meantime, the event has been triggered
        // already with `flushUpdateEvent()`, or the editor has been disposed
        if (currentCount !== updateCount || !scheduled || disposed) {
          return;
        }

        triggerUpdate();
      })();
    }),
  );
};
