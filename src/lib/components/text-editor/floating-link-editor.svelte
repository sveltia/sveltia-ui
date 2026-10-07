<!--
  @component
  Floating link editor for the rich text editor. While the caret is on a link, a small popup below
  it shows the URL along with buttons to edit and remove the link, and the URL can be edited right
  there, the same way it works in the Lexical Playground and Google Docs. The Link button and the
  Accel+K shortcut open the popup in the edit mode, also to link the selected text.

  The popup is rendered in the top layer with the Popover API, so it’s never clipped by whatever
  contains the editor.
  @see https://github.com/sveltia/sveltia-cms/issues/164
  @see https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
-->
<script>
  import { $isLinkNode as isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
  import { createDOMRange } from '@lexical/selection';
  import { $findMatchingParent as findMatchingParent } from '@lexical/utils';
  import { _, isRTL } from '@sveltia/i18n';
  import { matchesShortcuts } from '@sveltia/utils/events';
  import { isURL } from '@sveltia/utils/string';
  import {
    COMMAND_PRIORITY_HIGH,
    COMMAND_PRIORITY_NORMAL,
    KEY_ESCAPE_COMMAND,
    $getNodeByKey as getNodeByKey,
    $getPreviousSelection as getPreviousSelection,
    $getSelection as getSelection,
    $isRangeSelection as isRangeSelection,
    $setSelection as setSelection,
  } from 'lexical';
  import { getContext, onMount, tick, untrack } from 'svelte';
  import Button from '../button/button.svelte';
  import { getSuggestionListPosition } from '../emoji/position.js';
  import Icon from '../icon/icon.svelte';
  import TextInput from '../text-field/text-input.svelte';
  import { OPEN_LINK_EDITOR_COMMAND } from './constants.js';
  import { focusEditor, isSafeLinkURL } from './core.js';

  /**
   * @import { LexicalEditor, RangeSelection } from 'lexical';
   * @import { EmojiAnchorRect, TextEditorStore } from '#lib/typedefs.js';
   */

  /**
   * What the edit mode is editing: an existing link, or the selected text to be linked.
   * @typedef {{ linkKey: string } | { selection: RangeSelection }} LinkEditTarget
   */

  /**
   * Maximum width of the popup, also enforced in the stylesheet.
   */
  const MAX_WIDTH = 400;
  /**
   * Height to assume until the popup has been measured, so the first open is positioned sensibly.
   */
  const FALLBACK_HEIGHT = 48;
  /**
   * Margin to the viewport edges, matching the emoji suggestions.
   */
  const VIEWPORT_MARGIN = 8;

  const id = $props.id();

  /** @type {TextEditorStore} */
  const editorStore = getContext('editorStore');

  /**
   * The link at the selection, if any.
   * @type {{ key: string, url: string } | undefined}
   */
  let currentLink = $state();
  /**
   * Whether the focus is within the editor or the popup. The popup is hidden otherwise, so it
   * doesn’t linger once the user has moved on.
   */
  let hasFocus = $state(false);
  /**
   * Key of the link the user has dismissed the popup for with the Escape key, so it doesn’t come
   * back while the caret stays on the link.
   * @type {string | undefined}
   */
  let dismissedLinkKey = $state();
  /**
   * What is being edited, while the popup is in the edit mode.
   * @type {LinkEditTarget | undefined}
   */
  let editTarget = $state.raw();
  /** URL entered in the edit mode. */
  let url = $state('');
  /**
   * Viewport-relative bounds of the link, or the selected text, the popup is anchored to.
   * @type {EmojiAnchorRect | undefined}
   */
  let anchorRect = $state.raw();
  /**
   * Measured height of the popup.
   * @type {number}
   */
  let popupHeight = $state(0);
  /**
   * A reference to the popup element, which is only mounted while it’s shown.
   * @type {HTMLElement | undefined}
   */
  let popupElement = $state();
  /**
   * A reference to the URL field, which is only mounted in the edit mode.
   * @type {HTMLInputElement | undefined}
   */
  let inputElement = $state();

  const editing = $derived(!!editTarget);
  const isValidURL = $derived(!!url.trim() && isSafeLinkURL(url));
  const open = $derived(
    editing || (!!currentLink && hasFocus && dismissedLinkKey !== currentLink.key),
  );

  /**
   * Position of the popup, flipped above the link and clamped to the viewport as needed.
   */
  const position = $derived(
    anchorRect
      ? getSuggestionListPosition({
          anchorRect,
          listMaxHeight: popupHeight || FALLBACK_HEIGHT,
          viewport: { width: window.innerWidth, height: window.innerHeight },
          rtl: isRTL(),
          listWidth: Math.min(MAX_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2),
        })
      : undefined,
  );

  /**
   * Find the link that contains the whole selection. This must be called within an editor state
   * read.
   * @returns {import('@lexical/link').LinkNode | null} Link, if any.
   */
  const findLink = () => {
    const selection = getSelection();

    if (!isRangeSelection(selection)) {
      return null;
    }

    const link = findMatchingParent(selection.anchor.getNode(), isLinkNode);

    return link && findMatchingParent(selection.focus.getNode(), isLinkNode) === link
      ? /** @type {import('@lexical/link').LinkNode} */ (link)
      : null;
  };

  /**
   * Get the viewport-relative bounds of what the popup is anchored to: the text being linked in the
   * edit mode for a new link, or the link otherwise.
   * @param {LexicalEditor} editor Editor instance.
   * @returns {EmojiAnchorRect | undefined} Bounds, or `undefined` if they can’t be determined.
   */
  const getAnchorRect = (editor) => {
    /** @type {DOMRect | undefined} */
    let rect;

    if (editTarget && 'selection' in editTarget) {
      const { selection } = editTarget;

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
    } else {
      const key = editTarget && 'linkKey' in editTarget ? editTarget.linkKey : currentLink?.key;

      rect = key ? editor.getElementByKey(key)?.getBoundingClientRect() : undefined;
    }

    // The link or text may not be laid out, e.g. while the editor is hidden
    /* v8 ignore next */
    if (!rect || !(rect.top || rect.bottom || rect.left || rect.width || rect.height)) {
      return undefined;
    }

    const { top, bottom, left, right } = rect;

    return { top, bottom, left, right };
  };

  /**
   * Follow the link when the page or an ancestor is scrolled, the window is resized, or the
   * content has changed.
   */
  const reposition = () => {
    const { editor } = editorStore;

    anchorRect = editor && open ? getAnchorRect(editor) : undefined;
  };

  /**
   * Switch the popup to the edit mode, and move the focus to the URL field.
   * @param {LinkEditTarget} target What to edit.
   * @param {string} initialURL URL to fill the field with.
   */
  const startEditing = async (target, initialURL) => {
    editTarget = target;
    url = initialURL;
    dismissedLinkKey = undefined;
    await tick();
    reposition();
    await tick();
    inputElement?.focus();
    inputElement?.select();
  };

  /**
   * Leave the edit mode without applying anything.
   */
  const stopEditing = () => {
    editTarget = undefined;
    url = '';
  };

  /**
   * Move the focus back to the editor, where the selection is restored, after the popup is done.
   */
  const refocusEditor = async () => {
    // The editor is there for as long as the popup can be shown
    /* v8 ignore else */
    if (editorStore.editor) {
      await focusEditor(editorStore.editor);
    }
  };

  /**
   * Start editing the link at the selection, or start linking the selected text. This is the
   * handler for {@link OPEN_LINK_EDITOR_COMMAND}.
   * @returns {boolean} Whether there is anything to edit. If not, the Link button opens the dialog
   * to insert a link along with its text.
   */
  const onOpenCommand = () => {
    /** @type {LinkEditTarget | undefined} */
    let target;
    let initialURL = '';

    editorStore.editor?.getEditorState().read(() => {
      const link = findLink();

      if (link) {
        target = { linkKey: link.getKey() };
        initialURL = link.getURL();

        return;
      }

      // The selection is kept while the focus is on the toolbar
      const selection = getSelection() ?? getPreviousSelection();

      if (isRangeSelection(selection) && !selection.isCollapsed()) {
        const text = selection.getTextContent().trim();

        if (text) {
          target = { selection: selection.clone() };
          // Prefill the URL field with the selected text only if it’s a URL that can be linked to.
          // Otherwise, it’s just the link text, like a word or phrase.
          initialURL = isURL(text) && isSafeLinkURL(text) ? text : '';
        }
      }
    });

    if (!target) {
      return false;
    }

    startEditing(target, initialURL);

    return true;
  };

  /**
   * Apply the URL entered in the edit mode: update the link being edited, or link the selected
   * text.
   */
  const applyURL = async () => {
    const { editor } = editorStore;
    const target = editTarget;
    const newURL = url.trim();

    // The Apply button is disabled and the Enter key is ignored otherwise
    /* v8 ignore next */
    if (!editor || !target || !isValidURL) {
      return;
    }

    stopEditing();

    if ('linkKey' in target) {
      editor.update(() => {
        const node = getNodeByKey(target.linkKey);

        // The edit mode ends once the link is gone; see the update listener below
        /* v8 ignore else */
        if (isLinkNode(node)) {
          node.setURL(newURL);
        }
      });
    } else {
      editor.update(() => {
        setSelection(target.selection.clone());
      });
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, newURL);
    }

    await refocusEditor();
  };

  /**
   * Cancel the edit mode, and bring the focus back to the editor.
   */
  const cancelEditing = async () => {
    stopEditing();
    await refocusEditor();
  };

  /**
   * Remove the link at the selection, keeping its text.
   */
  const removeLink = async () => {
    const key = currentLink?.key;

    // The Remove button is only shown for a link
    /* v8 ignore next */
    if (!key) {
      return;
    }

    editorStore.editor?.update(() => {
      const node = getNodeByKey(key);

      // The popup only shows a link that is there
      /* v8 ignore else */
      if (isLinkNode(node)) {
        node.getChildren().forEach((child) => {
          node.insertBefore(child);
        });
        node.remove();
      }
    });

    await refocusEditor();
  };

  /**
   * Handle `keydown` event fired on the URL field.
   * @param {KeyboardEvent} event `keydown` event.
   */
  const onInputKeyDown = (event) => {
    // Leave the keys to an input method editor while it’s composing text, where Enter commits the
    // text and Escape cancels the composition
    if (event.isComposing) {
      return;
    }

    if (matchesShortcuts(event, 'Enter')) {
      event.preventDefault();

      if (isValidURL) {
        applyURL();
      }
    } else if (matchesShortcuts(event, 'Escape')) {
      // Don’t let the Escape key also close a dialog the editor is in
      event.preventDefault();
      event.stopPropagation();
      cancelEditing();
    }
  };

  $effect(() => {
    const { editor } = editorStore;

    // The root initializes the editor before this first runs
    /* v8 ignore next */
    if (!editor) {
      return undefined;
    }

    const unregisterCommand = editor.registerCommand(
      OPEN_LINK_EDITOR_COMMAND,
      onOpenCommand,
      COMMAND_PRIORITY_NORMAL,
    );

    // Dismiss the popup with the Escape key while the caret is on a link
    const unregisterEscape = editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      (event) => {
        if (!open || editing || !currentLink) {
          return false;
        }

        event?.preventDefault();
        dismissedLinkKey = currentLink.key;

        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );

    const unregisterUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const link = findLink();

        currentLink = link ? { key: link.getKey(), url: link.getURL() } : undefined;

        // What is being edited may be gone, e.g. when the value is replaced from outside, in which
        // case there is nothing to apply the URL to anymore
        if (
          editTarget &&
          ('linkKey' in editTarget
            ? !isLinkNode(getNodeByKey(editTarget.linkKey))
            : [editTarget.selection.anchor, editTarget.selection.focus].some(
                ({ key }) => !getNodeByKey(key)?.isAttached(),
              ))
        ) {
          stopEditing();
        }
      });

      if (dismissedLinkKey && currentLink?.key !== dismissedLinkKey) {
        dismissedLinkKey = undefined;
      }

      reposition();
    });

    const unregisterEditableListener = editor.registerEditableListener((editable) => {
      if (!editable) {
        stopEditing();
      }
    });

    return () => {
      unregisterCommand();
      unregisterEscape();
      unregisterUpdateListener();
      unregisterEditableListener();
    };
  });

  // The rich text editor can be swapped for the plain text one at any time, in which case there is
  // no link to anchor the popup to anymore
  $effect(() => {
    if (!editorStore.useRichText) {
      stopEditing();
      currentLink = undefined;
    }
  });

  $effect(() => {
    void open;
    reposition();
  });

  // Move the popup to the top layer, so it’s not clipped by anything around the editor, then
  // measure it. The measurement has to happen after the popover is shown, because until then the
  // element isn’t rendered at all and everything measures zero.
  $effect(() => {
    void editing;

    if (!popupElement) {
      return;
    }

    if (!popupElement.matches(':popover-open')) {
      popupElement.showPopover?.();
    }

    popupHeight = popupElement.getBoundingClientRect().height;
  });

  onMount(() => {
    /**
     * Check if the given node is within the editor or the popup.
     * @param {EventTarget | null} target Node.
     * @returns {boolean} Result.
     */
    const isWithin = (target) => {
      const node = /** @type {Node | null} */ (target);
      const root = editorStore.editor?.getRootElement();

      return !!node && (!!root?.contains(node) || !!popupElement?.contains(node));
    };

    // The state is updated within `untrack()` below, because the browser fires these events
    // synchronously while it removes a focused element from the DOM, e.g. the URL field when the
    // edit mode ends — which is to say, in the middle of Svelte rendering, where a plain assignment
    // would be reported as an unsafe mutation. See also `close()` in `<EmojiSuggestions>`.

    /**
     * Track the focus. Moving it anywhere but the popup, including back to the text, leaves the
     * edit mode without applying anything, like clicking away from a menu.
     * @param {FocusEvent} event `focusin` event.
     */
    const onFocusIn = ({ target }) => {
      untrack(() => {
        hasFocus = isWithin(target);

        if (editing && !popupElement?.contains(/** @type {Node} */ (target))) {
          stopEditing();
        }
      });
    };

    /**
     * Track the focus leaving the page or a removed element, which doesn’t fire `focusin`.
     * @param {FocusEvent} event `focusout` event.
     */
    const onFocusOut = ({ relatedTarget }) => {
      if (!relatedTarget) {
        untrack(() => {
          hasFocus = false;
        });
      }
    };

    window.addEventListener('scroll', reposition, { capture: true, passive: true });
    window.addEventListener('resize', reposition, { passive: true });
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);

    return () => {
      window.removeEventListener('scroll', reposition, { capture: true });
      window.removeEventListener('resize', reposition);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  });
</script>

{#if open && position}
  <div
    bind:this={popupElement}
    role="group"
    class="sui floating-link-editor"
    aria-label={_('_sui.text_editor.link')}
    popover="manual"
    style:top={position.top}
    style:bottom={position.bottom}
    style:left={position.left}
    onmousedown={(event) => {
      // Keep the focus where it is when the popup’s background is pressed, which would otherwise
      // move it to the page, hiding the popup or blurring the URL field
      if (event.target === event.currentTarget) {
        event.preventDefault();
      }
    }}
  >
    {#if editing}
      <TextInput
        bind:element={inputElement}
        dir="ltr"
        id="{id}-url"
        bind:value={url}
        flex
        invalid={!!url.trim() && !isSafeLinkURL(url)}
        aria-label={_('_sui.text_editor.url')}
        onkeydown={(event) => {
          onInputKeyDown(event);
        }}
      />
      <Button
        iconic
        variant="ghost"
        disabled={!isValidURL}
        aria-label={editTarget && 'linkKey' in editTarget ? _('_sui.update') : _('_sui.insert')}
        onclick={() => {
          applyURL();
        }}
      >
        {#snippet startIcon()}
          <Icon name="check" />
        {/snippet}
      </Button>
      <Button
        iconic
        variant="ghost"
        aria-label={_('_sui.cancel')}
        onclick={() => {
          cancelEditing();
        }}
      >
        {#snippet startIcon()}
          <Icon name="close" />
        {/snippet}
      </Button>
    {:else if currentLink}
      <a
        class="url"
        href={isSafeLinkURL(currentLink.url) ? currentLink.url : undefined}
        target="_blank"
        rel="noopener noreferrer"
        dir="ltr"
      >
        {currentLink.url}
      </a>
      <Button
        iconic
        variant="ghost"
        aria-label={_('_sui.text_editor.edit_link')}
        onclick={() => {
          // The link is still at the selection, since the focus is within the popup
          /* v8 ignore else */
          if (currentLink) {
            startEditing({ linkKey: currentLink.key }, currentLink.url);
          }
        }}
      >
        {#snippet startIcon()}
          <Icon name="edit" />
        {/snippet}
      </Button>
      <Button
        iconic
        variant="ghost"
        aria-label={_('_sui.text_editor.remove_link')}
        onclick={() => {
          removeLink();
        }}
      >
        {#snippet startIcon()}
          <Icon name="link_off" />
        {/snippet}
      </Button>
    {/if}
  </div>
{/if}

<style lang="scss">
  .floating-link-editor {
    position: fixed;
    inset: auto;
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 0;
    border-width: var(--sui-listbox-border-width, 1px);
    border-style: var(--sui-listbox-border-style, solid);
    border-color: var(--sui-listbox-border-color, var(--sui-secondary-border-color));
    border-radius: var(--sui-listbox-border-radius, 4px);
    padding: 4px;
    width: min(400px, calc(100vw - 16px));
    color: var(--sui-primary-foreground-color);
    background-color: var(--sui-secondary-background-color-translucent);
    box-shadow: 0 8px 16px var(--sui-popup-shadow-color);
    -webkit-backdrop-filter: blur(16px);
    backdrop-filter: blur(16px);
    font-family: var(--sui-control-font-family);
    font-size: var(--sui-control-font-size);
    line-height: var(--sui-control-line-height);

    :global {
      .sui.text-input {
        flex: auto;
        margin: 0 !important;
        min-width: 0;
      }

      .sui.button {
        flex: none;
        margin: 0 !important;
      }
    }
  }

  .url {
    flex: auto;
    overflow: hidden;
    padding: 0 8px;
    min-width: 0;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
