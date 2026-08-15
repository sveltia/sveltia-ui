<!--
  @component
  Emoji autocomplete for a plain `<input>` or `<textarea>`. Typing a colon followed by one or more
  characters, like `:smi`, brings up a list of matching emojis that can be inserted with a click or
  the Enter key, the same way it works on GitHub, Slack and other apps. This wires the field up to
  `<EmojiSuggestions>`, which owns the dropdown itself.
-->
<script>
  import { getFieldCaretRect } from '../emoji/caret.js';
  import { detectEmojiTrigger, getEmojiInsertText } from '../emoji/emoji.js';
  import EmojiSuggestions from '../emoji/emoji-suggestions.svelte';

  /**
   * @import { EmojiEntry, EmojiTrigger } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {HTMLInputElement | HTMLTextAreaElement} [element] The field to attach the
   * suggestions to.
   */

  /**
   * A shortcode within a text field, identified by where its colon is, which doesn’t change as the
   * query grows.
   * @typedef {EmojiTrigger & { start: number, end: number }} FieldEmojiTrigger
   */

  /**
   * @type {Props}
   */
  let {
    /* eslint-disable prefer-const */
    element = undefined,
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * A reference to the dropdown.
   * @type {ReturnType<typeof EmojiSuggestions> | undefined}
   */
  let list = $state();

  /**
   * Look for a shortcode being typed right before the caret.
   * @returns {FieldEmojiTrigger | undefined} Shortcode state, if any.
   */
  const findTrigger = () => {
    if (!element || element.disabled || element.readOnly) {
      return undefined;
    }

    const { value, selectionStart, selectionEnd } = element;

    // Only suggest at a plain caret, not while a range is selected
    if (selectionStart === null || selectionStart !== selectionEnd) {
      return undefined;
    }

    const query = detectEmojiTrigger(value.slice(0, selectionStart));

    if (query === undefined) {
      return undefined;
    }

    const start = selectionStart - query.length - 1;

    return { id: String(start), query, start, end: selectionStart };
  };

  /**
   * Get the viewport-relative bounds of the shortcode being typed.
   * @param {EmojiTrigger} trigger Shortcode state.
   * @returns {ReturnType<typeof getFieldCaretRect>} Bounds, or `undefined` if they can’t be
   * determined.
   */
  const getAnchorRect = (trigger) => {
    const { start, end } = /** @type {FieldEmojiTrigger} */ (trigger);

    return element ? getFieldCaretRect(element, start, end) : undefined;
  };

  /**
   * Replace the shortcode being typed with the given emoji.
   * @param {EmojiEntry} entry Emoji to insert.
   * @param {EmojiTrigger} trigger Shortcode to replace.
   */
  const insertEmoji = (entry, trigger) => {
    const { query, start, end } = /** @type {FieldEmojiTrigger} */ (trigger);

    // Make sure the shortcode is still where it was when the suggestions appeared
    if (!element || element.value.slice(start, end) !== `:${query}`) {
      return;
    }

    const text = getEmojiInsertText(entry.emoji, element.value.slice(end));

    element.focus();
    element.setSelectionRange(start, end);

    // `execCommand()` is deprecated but remains the only way to edit a field without wiping its
    // native undo history, so it’s tried first and `setRangeText()` covers the fallback
    let inserted = false;

    try {
      inserted = document.execCommand('insertText', false, text);
    } catch {
      inserted = false;
    }

    if (!inserted) {
      element.setRangeText(text, start, end, 'end');
      // Let Svelte bindings and consumer handlers know the value changed
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  $effect(() => {
    if (!element || !list) {
      return undefined;
    }

    const field = element;

    /**
     * Re-examine the text around the caret.
     */
    const refresh = () => {
      list?.update(findTrigger());
    };

    /**
     * Give the list first refusal on the keys it drives. Anything it doesn’t take is left to the
     * field, and the `keyup` listener below picks up wherever the caret ends up.
     * @param {Event} event `keydown` event.
     */
    const onKeyDown = (event) => {
      list?.handleKeyDown(/** @type {KeyboardEvent} */ (event));
    };

    /**
     * Close the list when the field loses the focus.
     */
    const onBlur = () => {
      list?.close();
    };

    field.addEventListener('keydown', onKeyDown);
    field.addEventListener('keyup', refresh);
    field.addEventListener('input', refresh);
    field.addEventListener('mouseup', refresh);
    field.addEventListener('blur', onBlur);

    return () => {
      field.removeEventListener('keydown', onKeyDown);
      field.removeEventListener('keyup', refresh);
      field.removeEventListener('input', refresh);
      field.removeEventListener('mouseup', refresh);
      field.removeEventListener('blur', onBlur);
      list?.close();
    };
  });
</script>

<EmojiSuggestions bind:this={list} {getAnchorRect} onSelect={insertEmoji} ariaOwner={element} />
