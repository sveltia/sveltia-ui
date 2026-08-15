<!--
  @component
  Emoji autocomplete for the rich text editor. Typing a colon followed by one or more characters,
  like `:smi`, brings up a list of matching emojis that can be inserted with a click or the Enter
  key, the same way it works on GitHub, Slack and other apps. This wires the Lexical editor up to
  `<EmojiSuggestions>`, which owns the dropdown itself.
-->
<script>
  import { $isCodeNode as isCodeNode } from '@lexical/code-core';
  import {
    COMMAND_PRIORITY_CRITICAL,
    $getNodeByKey as getNodeByKey,
    $getSelection as getSelection,
    $isRangeSelection as isRangeSelection,
    $isTextNode as isTextNode,
    KEY_ARROW_DOWN_COMMAND,
    KEY_ARROW_UP_COMMAND,
    KEY_ENTER_COMMAND,
    KEY_ESCAPE_COMMAND,
    KEY_TAB_COMMAND,
  } from 'lexical';
  import { getContext } from 'svelte';
  import { detectEmojiTrigger, getEmojiInsertText } from '../emoji/emoji.js';
  import EmojiSuggestions from '../emoji/emoji-suggestions.svelte';

  /**
   * @import { EmojiAnchorRect, EmojiEntry, EmojiTrigger, TextEditorStore } from '$lib/typedefs';
   */

  /**
   * A shortcode within the Lexical editor, identified by the text node it sits in and where its
   * colon is, which doesn’t change as the query grows.
   * @typedef {EmojiTrigger & { nodeKey: string, offset: number }} LexicalEmojiTrigger
   */

  /** @type {TextEditorStore} */
  const editorStore = getContext('editorStore');

  /**
   * A reference to the dropdown.
   * @type {ReturnType<typeof EmojiSuggestions> | undefined}
   */
  let list = $state();

  /**
   * Look for a shortcode being typed right before the caret. This must be called within an editor
   * state read.
   * @returns {LexicalEmojiTrigger | undefined} Shortcode state, if any.
   */
  const findTrigger = () => {
    const selection = getSelection();

    // Never suggest emojis within code, where a colon is much more likely to be code than a
    // shortcode
    if (!isRangeSelection(selection) || !selection.isCollapsed() || selection.hasFormat('code')) {
      return undefined;
    }

    const node = selection.anchor.getNode();

    if (!isTextNode(node) || !node.isSimpleText() || isCodeNode(node.getParent())) {
      return undefined;
    }

    const { offset } = selection.anchor;
    const query = detectEmojiTrigger(node.getTextContent().slice(0, offset));

    if (query === undefined) {
      return undefined;
    }

    const nodeKey = node.getKey();

    return { id: `${nodeKey}:${offset - query.length - 1}`, query, nodeKey, offset };
  };

  /**
   * Get the viewport-relative bounds of the shortcode being typed. The DOM selection is used rather
   * than the Lexical node, because the caret is exactly where the shortcode ends, and the browser
   * has already laid it out by the time an update listener runs.
   * @param {EmojiTrigger} trigger Shortcode state.
   * @returns {EmojiAnchorRect | undefined} Bounds, or `undefined` if they can’t be determined.
   */
  const getAnchorRect = ({ query }) => {
    const domSelection = window.getSelection();

    if (!domSelection?.rangeCount) {
      return undefined;
    }

    const range = domSelection.getRangeAt(0).cloneRange();

    try {
      range.setStart(range.startContainer, Math.max(0, range.startOffset - query.length - 1));
    } catch {
      // The container turned out to be shorter than expected; fall back to the collapsed caret
    }

    const { top, bottom, left, right, width, height } = range.getBoundingClientRect();

    // A range with no client rects yields an all-zero rectangle
    return top || bottom || left || width || height ? { top, bottom, left, right } : undefined;
  };

  /**
   * Replace the shortcode being typed with the given emoji.
   * @param {EmojiEntry} entry Emoji to insert.
   * @param {EmojiTrigger} trigger Shortcode to replace.
   */
  const insertEmoji = (entry, trigger) => {
    const { editor } = editorStore;
    const { query, nodeKey, offset } = /** @type {LexicalEmojiTrigger} */ (trigger);
    const start = offset - query.length - 1;

    editor?.update(() => {
      const node = getNodeByKey(nodeKey);

      // Make sure the shortcode is still where it was when the suggestions appeared
      if (!isTextNode(node) || node.getTextContent().slice(start, offset) !== `:${query}`) {
        return;
      }

      const text = getEmojiInsertText(entry.emoji, node.getTextContent().slice(offset));

      node.spliceText(start, query.length + 1, text, true);
    });
  };

  /**
   * Register the keyboard shortcuts that drive the list, as well as the listener that watches for
   * shortcodes. The shortcuts are registered with the highest priority, so they take precedence
   * over the editor’s own handling while the list is open, and return `false` otherwise to leave
   * the editor alone.
   * @returns {Array<() => void>} Cleanup handlers.
   */
  const registerCommands = () => {
    const { editor } = editorStore;

    if (!editor) {
      return [];
    }

    /**
     * Create a command listener that only acts while the list is open.
     * @param {() => void} handler Handler to be called.
     * @returns {(event: KeyboardEvent | null) => boolean} Command listener.
     */
    const whileOpen = (handler) => (event) => {
      if (!list?.isOpen()) {
        return false;
      }

      event?.preventDefault();
      handler();

      return true;
    };

    return [
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        whileOpen(() => list?.moveSelection(1)),
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        whileOpen(() => list?.moveSelection(-1)),
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        whileOpen(() => list?.selectHighlighted()),
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_TAB_COMMAND,
        whileOpen(() => list?.selectHighlighted()),
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        whileOpen(() => list?.close(true)),
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerUpdateListener(({ editorState }) => {
        /** @type {LexicalEmojiTrigger | undefined} */
        let trigger;

        editorState.read(() => {
          trigger = findTrigger();
        });

        list?.update(trigger);
      }),
    ];
  };

  $effect(() => {
    if (!editorStore.editor || !list) {
      return undefined;
    }

    const unregisters = registerCommands();

    return () => {
      unregisters.forEach((unregister) => unregister());
      list?.close();
    };
  });

  // The rich text editor can be swapped for the plain text one at any time, in which case there is
  // no caret to anchor the dropdown to anymore
  $effect(() => {
    if (!editorStore.useRichText) {
      list?.close();
    }
  });
</script>

<EmojiSuggestions
  bind:this={list}
  {getAnchorRect}
  onSelect={insertEmoji}
  ariaOwner={editorStore.editor?.getRootElement() ?? undefined}
/>
