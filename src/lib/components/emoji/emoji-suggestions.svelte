<!--
  @component
  The dropdown shown while an emoji shortcode is being typed, along with the state behind it. This
  knows nothing about where the text is being typed; a host component detects the shortcode, feeds
  it in with {@link update} and applies the chosen emoji through the `onSelect` callback.

  The list is rendered in the top layer with the Popover API, so it’s never clipped by whatever
  contains the field, and it never takes the focus, so the user can keep typing to narrow down the
  suggestions.
  @see https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
-->
<script>
  import { _ } from '@sveltia/i18n';
  import { onMount } from 'svelte';
  import { loadEmojiList, searchEmojis } from './emoji.js';

  /**
   * @import { EmojiAnchorRect, EmojiEntry, EmojiTrigger } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {(trigger: EmojiTrigger) => EmojiAnchorRect | undefined} getAnchorRect Get the
   * viewport-relative bounds of the shortcode being typed, which the dropdown is anchored to.
   * @property {(entry: EmojiEntry, trigger: EmojiTrigger) => void} onSelect Called with the emoji
   * the user picked and the shortcode it should replace.
   * @property {HTMLElement} [ariaOwner] The element holding the caret, which is labelled with the
   * highlighted suggestion because the focus never moves to the dropdown.
   */

  /**
   * @type {Props}
   */
  let {
    /* eslint-disable prefer-const */
    getAnchorRect,
    onSelect,
    ariaOwner = undefined,
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * Estimated size of the dropdown, used to decide whether it fits below the caret. The width is
   * also enforced in the stylesheet below.
   */
  const LIST_WIDTH = 280;
  const LIST_MAX_HEIGHT = 280;
  /**
   * Gap between the dropdown and the caret, and the minimum margin to the viewport edges.
   */
  const LIST_OFFSET = 4;
  const VIEWPORT_MARGIN = 8;

  const listId = $props.id();

  /**
   * The shortcode currently being typed, if any.
   * @type {EmojiTrigger | undefined}
   */
  let trigger = $state();
  /**
   * Emojis matching the {@link trigger}’s query.
   * @type {EmojiEntry[]}
   */
  let candidates = $state([]);
  /**
   * Index of the highlighted candidate.
   * @type {number}
   */
  let selectedIndex = $state(0);
  /**
   * Viewport-relative bounds of the shortcode being typed.
   * @type {EmojiAnchorRect | undefined}
   */
  let anchorRect = $state();
  /**
   * A reference to the dropdown element, which is only mounted while suggestions are shown.
   * @type {HTMLElement | undefined}
   */
  let listElement = $state();
  /**
   * Monotonically increasing counter used to discard the result of a search that has been
   * superseded while the emoji list was being loaded.
   * @type {number}
   */
  let searchGeneration = 0;
  /**
   * Identifier of the shortcode the user has dismissed with the Escape key, so the suggestions
   * don’t come back while they keep typing it.
   * @type {string | undefined}
   */
  let dismissedShortcodeId = $state();

  const open = $derived(!!trigger && !!candidates.length);

  /**
   * Position of the dropdown, flipped above the caret and clamped to the viewport as needed.
   *
   * The dropdown grows away from the start of the line, so it follows the reading direction rather
   * than reaching back across the text: in a right-to-left layout it hangs from the shortcode’s
   * right edge and extends leftwards, mirroring what `activatePopup()` does for anchored popups.
   */
  const position = $derived.by(() => {
    if (!anchorRect) {
      return undefined;
    }

    const { innerWidth, innerHeight } = window;
    const spaceBelow = innerHeight - anchorRect.bottom;
    const spaceAbove = anchorRect.top;
    const flipped = spaceBelow < LIST_MAX_HEIGHT + VIEWPORT_MARGIN && spaceAbove > spaceBelow;
    const rtl = document.dir === 'rtl';
    const anchorLeft = rtl ? anchorRect.right - LIST_WIDTH : anchorRect.left;

    return {
      top: flipped ? undefined : `${Math.round(anchorRect.bottom + LIST_OFFSET)}px`,
      bottom: flipped ? `${Math.round(innerHeight - anchorRect.top + LIST_OFFSET)}px` : undefined,
      left: `${Math.round(
        Math.max(VIEWPORT_MARGIN, Math.min(anchorLeft, innerWidth - LIST_WIDTH - VIEWPORT_MARGIN)),
      )}px`,
      maxHeight: `${Math.round(
        Math.min(
          LIST_MAX_HEIGHT,
          (flipped ? spaceAbove : spaceBelow) - LIST_OFFSET - VIEWPORT_MARGIN,
        ),
      )}px`,
    };
  });

  /**
   * Whether any suggestions are currently shown.
   * @returns {boolean} Result.
   */
  export const isOpen = () => open;

  /**
   * Close the list and forget the current shortcode.
   * @param {boolean} [dismissed] Whether the user has dismissed the list, in which case it stays
   * closed until they move on to another shortcode.
   */
  export const close = (dismissed = false) => {
    dismissedShortcodeId = dismissed && trigger ? trigger.id : undefined;
    trigger = undefined;
    candidates = [];
    selectedIndex = 0;
    anchorRect = undefined;
    searchGeneration += 1;
  };

  /**
   * Feed the shortcode being typed into the list, or nothing to close it.
   * @param {EmojiTrigger} [newTrigger] Shortcode state.
   */
  export const update = async (newTrigger) => {
    if (!newTrigger) {
      if (trigger || dismissedShortcodeId) {
        close();
      }

      return;
    }

    // The user has dismissed this very shortcode with the Escape key
    if (dismissedShortcodeId === newTrigger.id) {
      return;
    }

    const { id, query } = newTrigger;

    dismissedShortcodeId = undefined;
    anchorRect = getAnchorRect(newTrigger);

    // The caret may have moved without the query changing, e.g. with an undo; keep the existing
    // suggestions in that case, so the highlighted item doesn’t jump back to the top
    if (trigger?.id === id && trigger.query === query) {
      trigger = newTrigger;

      return;
    }

    trigger = newTrigger;
    searchGeneration += 1;

    const generation = searchGeneration;

    await loadEmojiList();

    // Bail out if the user has kept typing in the meantime
    if (generation !== searchGeneration) {
      return;
    }

    candidates = searchEmojis(query);
    selectedIndex = 0;
  };

  /**
   * Move the highlight by the given amount, wrapping around at both ends.
   * @param {number} delta Number of items to move.
   */
  export const moveSelection = (delta) => {
    const { length } = candidates;

    if (length) {
      selectedIndex = (selectedIndex + delta + length) % length;
    }
  };

  /**
   * Apply the highlighted suggestion and close the list.
   */
  export const selectHighlighted = () => {
    const entry = candidates[selectedIndex];

    if (entry && trigger) {
      onSelect(entry, trigger);
    }

    close();
  };

  /**
   * Handle a `keydown` event on the field the list is attached to.
   * @param {KeyboardEvent} event `keydown` event.
   * @returns {boolean} `true` if the list consumed the event, in which case the field should
   * ignore it.
   */
  export const handleKeyDown = (event) => {
    const { key, altKey, ctrlKey, metaKey, shiftKey } = event;

    if (!open || altKey || ctrlKey || metaKey) {
      return false;
    }

    if (key === 'ArrowDown' || key === 'ArrowUp') {
      moveSelection(key === 'ArrowDown' ? 1 : -1);
    } else if ((key === 'Enter' || key === 'Tab') && !shiftKey) {
      selectHighlighted();
    } else if (key === 'Escape') {
      close(true);
    } else {
      return false;
    }

    event.preventDefault();

    return true;
  };

  // Move the dropdown to the top layer, so it’s not clipped by anything around the field
  $effect(() => {
    if (listElement && !listElement.matches(':popover-open')) {
      listElement.showPopover?.();
    }
  });

  // Advertise that typing here can bring up predictions, for as long as the autocomplete is
  // attached. `aria-autocomplete` applies to a textbox as much as to a combobox, so the field keeps
  // whatever role it already had rather than being relabelled — a rich text editor is not a
  // combobox, and neither is a comment field. `list` says the predictions appear in a popup rather
  // than being completed inline.
  // @see https://w3c.github.io/aria/#aria-autocomplete
  $effect(() => {
    if (!ariaOwner) {
      return undefined;
    }

    const owner = ariaOwner;

    owner.setAttribute('aria-autocomplete', 'list');
    owner.setAttribute('aria-haspopup', 'listbox');

    return () => {
      owner.removeAttribute('aria-autocomplete');
      owner.removeAttribute('aria-haspopup');
    };
  });

  // Point at the highlighted suggestion, given the focus stays in the field. The list is only in
  // the DOM while open, so it can only be referenced while it is. There is deliberately no
  // `aria-expanded`, which a textbox doesn’t support; the active descendant appearing and
  // disappearing is what conveys the list opening and closing.
  $effect(() => {
    if (!ariaOwner) {
      return undefined;
    }

    const owner = ariaOwner;

    if (open) {
      owner.setAttribute('aria-controls', listId);
      owner.setAttribute('aria-activedescendant', `${listId}-option-${selectedIndex}`);
    } else {
      owner.removeAttribute('aria-controls');
      owner.removeAttribute('aria-activedescendant');
    }

    return () => {
      owner.removeAttribute('aria-controls');
      owner.removeAttribute('aria-activedescendant');
    };
  });

  // Keep the highlighted suggestion visible while the user arrows through a long list
  $effect(() => {
    void selectedIndex;

    listElement?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  });

  onMount(() => {
    // Warm the data up front, so the first shortcode the user types shows suggestions straight away
    // rather than waiting on the network. The loader memoizes, so this costs one request per page
    // however many fields are on it, and nothing at all once it’s cached.
    loadEmojiList();

    /**
     * Follow the caret when the page or an ancestor is scrolled or the window is resized.
     */
    const reposition = () => {
      if (trigger) {
        anchorRect = getAnchorRect(trigger);
      }
    };

    window.addEventListener('scroll', reposition, { capture: true, passive: true });
    window.addEventListener('resize', reposition, { passive: true });

    return () => {
      window.removeEventListener('scroll', reposition, { capture: true });
      window.removeEventListener('resize', reposition);
    };
  });
</script>

{#if open && position}
  <div
    bind:this={listElement}
    id={listId}
    role="listbox"
    class="sui emoji-suggestions"
    aria-label={_('_sui.emoji_suggestions')}
    popover="manual"
    style:top={position.top}
    style:bottom={position.bottom}
    style:left={position.left}
    style:max-height={position.maxHeight}
  >
    {#each candidates as entry, index (entry.emoji)}
      <div
        id="{listId}-option-{index}"
        role="option"
        class="option"
        tabindex="-1"
        aria-selected={index === selectedIndex}
        onmouseenter={() => {
          selectedIndex = index;
        }}
        onmousedown={(event) => {
          // Keep the focus and the caret where they are, so the shortcode can be replaced
          event.preventDefault();
          selectedIndex = index;
          selectHighlighted();
        }}
      >
        <span role="none" class="emoji">{entry.emoji}</span>
        <span role="none" class="name">:{entry.name}:</span>
      </div>
    {/each}
  </div>
{/if}

<style lang="scss">
  .emoji-suggestions {
    position: fixed;
    inset: auto;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    margin: 0;
    border-width: var(--sui-listbox-border-width, 1px);
    border-style: var(--sui-listbox-border-style, solid);
    border-color: var(--sui-listbox-border-width, var(--sui-secondary-border-color));
    border-radius: var(--sui-listbox-border-radius, 4px);
    padding: var(--sui-listbox-padding, 4px);
    width: 280px;
    color: var(--sui-primary-foreground-color);
    background-color: var(--sui-secondary-background-color-translucent);
    box-shadow: 0 8px 16px var(--sui-popup-shadow-color);
    -webkit-backdrop-filter: blur(16px);
    backdrop-filter: blur(16px);
    font-family: var(--sui-control-font-family);
    font-size: var(--sui-control-font-size);
    line-height: var(--sui-control-line-height);
    -webkit-user-select: none;
    user-select: none;
  }

  .option {
    flex: none;
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: var(--sui-option-border-radius);
    padding: var(--sui-option-padding);
    min-height: var(--sui-option-height);
    cursor: default;

    &[aria-selected='true'] {
      color: var(--sui-highlight-foreground-color);
      background-color: var(--sui-hover-background-color);
    }

    .emoji {
      flex: none;
      width: 1.5em;
      font-size: var(--sui-font-size-large);
      text-align: center;
    }

    .name {
      flex: auto;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
</style>
