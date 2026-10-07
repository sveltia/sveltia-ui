<script>
  import { TOGGLE_LINK_COMMAND } from '@lexical/link';
  import { _ } from '@sveltia/i18n';
  import { isMac, matchesShortcuts } from '@sveltia/utils/events';
  import { isURL } from '@sveltia/utils/string';
  import {
    COMMAND_PRIORITY_NORMAL,
    KEY_DOWN_COMMAND,
    $createRangeSelection as createRangeSelection,
    $createTextNode as createTextNode,
    $getPreviousSelection as getPreviousSelection,
    $getSelection as getSelection,
    $getTextContent as getTextContent,
    $insertNodes as insertNodes,
    $isRangeSelection as isRangeSelection,
    $setSelection as setSelection,
  } from 'lexical';
  import { getContext } from 'svelte';
  import Button from '../../button/button.svelte';
  import Dialog from '../../dialog/dialog.svelte';
  import Icon from '../../icon/icon.svelte';
  import TextInput from '../../text-field/text-input.svelte';
  import { AVAILABLE_BUTTONS, OPEN_LINK_EDITOR_COMMAND } from '../constants.js';
  import { focusEditor, isSafeLinkURL } from '../core.js';
  import {
    editRawText,
    getRawTextState,
    insertLink,
    registerRawTextShortcut,
  } from '../raw-markdown.js';

  /**
   * @import { TextEditorStore } from '#lib/typedefs.js';
   */

  const id = $props.id();

  /**
   * Button type.
   */
  const type = 'link';

  /** @type {TextEditorStore} */
  const editorStore = getContext('editorStore');
  const selectionTypeMatches = $derived(editorStore.selection.inlineTypes.includes(type));

  let openDialog = $state(false);
  let hasAnchor = $state(false);
  let anchorURL = $state('');
  let anchorText = $state('');
  /**
   * Whether the URL can be inserted: not empty, and safe to link to.
   */
  const isValidURL = $derived(!!anchorURL.trim() && isSafeLinkURL(anchorURL));

  /**
   * Open the dialog to create a new link from the given selected text.
   * @param {string} textContent Selected text.
   */
  const openCreateDialog = (textContent) => {
    // Prefill the URL field with the selected text only if it’s a URL that can be linked to.
    // Otherwise, it’s just the link text, like a word or phrase.
    anchorURL = isURL(textContent) && isSafeLinkURL(textContent) ? textContent : '';
    hasAnchor = !!textContent;
    openDialog = true;
  };

  /**
   * Create a new link by showing a dialog to accept a URL and optionally text.
   */
  const createLink = () => {
    const { textArea, useRichText } = editorStore;

    if (!useRichText) {
      // The button is only enabled while the `<textarea>` is there
      /* v8 ignore else */
      if (textArea) {
        const { value, start, end } = getRawTextState(textArea);

        openCreateDialog(value.slice(start, end).trim());
      }

      return;
    }

    editorStore.editor?.getEditorState().read(() => {
      openCreateDialog(getTextContent().trim());
    });
  };

  /**
   * Handle `click` event fired on the Link button. In the rich text mode, the floating link editor
   * takes care of a selected link or text. Otherwise, create a new link with the dialog.
   */
  const onButtonClick = () => {
    // Links are not detected in the plain text mode, so a new one is always created there
    if (
      editorStore.useRichText &&
      editorStore.editor?.dispatchCommand(OPEN_LINK_EDITOR_COMMAND, undefined)
    ) {
      return;
    }

    createLink();
  };

  /**
   * Handle `keydown` event fired on the input fields on the dialog.
   * @param {KeyboardEvent} event `keydown` event.
   */
  const onInputKeyDown = (event) => {
    if (matchesShortcuts(event, 'Enter') && isValidURL) {
      openDialog = false;
    }
  };

  /**
   * Handle `close` event fired on the dialog. Insert a link with the given URL and optionally text.
   * @param {CustomEvent} event `close` event.
   * @see https://github.com/facebook/lexical/discussions/3013
   */
  const onDialogClose = async (event) => {
    const { textArea, useRichText } = editorStore;

    if (!useRichText) {
      // The dialog can only be opened from the button, which needs the `<textarea>`
      /* v8 ignore else */
      if (textArea) {
        if (event.detail.returnValue !== 'cancel') {
          editRawText(textArea, (state) =>
            insertLink(state, { url: anchorURL.trim(), text: hasAnchor ? undefined : anchorText }),
          );
        } else {
          textArea.focus();
        }
      }

      anchorURL = '';
      anchorText = '';

      return;
    }

    if (event.detail.returnValue !== 'cancel') {
      // The dialog can only be opened from the button, which needs the editor
      /* v8 ignore next */
      if (!editorStore.editor) {
        return;
      }

      await new Promise((resolve) => {
        editorStore.editor?.update(async () => {
          let _selection = getSelection() ?? getPreviousSelection()?.clone();

          if (!isRangeSelection(_selection)) {
            _selection = createRangeSelection();
          }

          if (!hasAnchor) {
            anchorText = anchorText.trim();
            anchorText ||= anchorURL;
            insertNodes([createTextNode(anchorText)]);
          }

          setSelection(_selection);
          resolve(undefined);
        });
      });

      await focusEditor(editorStore.editor);
      editorStore.editor.dispatchCommand(TOGGLE_LINK_COMMAND, anchorURL);
    } else /* v8 ignore else */ if (editorStore.editor) {
      // The dialog leaves the focus alone (see `restoreFocus` below), so bring it back here
      await focusEditor(editorStore.editor);
    }

    anchorURL = '';
    anchorText = '';
  };

  /**
   * Open the dialog with a keyboard shortcut: Accel+K.
   * @returns {(() => void) | undefined} Function to unregister the command.
   */
  const _registerCommand = () =>
    editorStore.editor?.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        if (matchesShortcuts(event, isMac() ? 'Meta+K' : 'Ctrl+K')) {
          event.preventDefault();
          onButtonClick();
        }

        return false;
      },
      COMMAND_PRIORITY_NORMAL,
    );

  $effect(() => {
    const { textArea } = editorStore;

    if (!textArea) {
      return undefined;
    }

    // Handle the keyboard shortcut in the plain text mode
    return registerRawTextShortcut(textArea, 'K', () => {
      onButtonClick();
    });
  });

  $effect(() => {
    if (editorStore.editor) {
      // Unregister on unmount, e.g. when the toolbar swaps the button out while the caret is in a
      // code block, so the shortcut isn’t handled by a stale instance
      return _registerCommand();
    }

    return undefined;
  });
</script>

<Button
  iconic
  aria-label={_(`_sui.text_editor.${AVAILABLE_BUTTONS[type].labelKey}`)}
  aria-controls={editorStore.controlId}
  pressed={selectionTypeMatches && editorStore.useRichText}
  onclick={() => {
    onButtonClick();
  }}
>
  {#snippet startIcon()}
    <Icon name={AVAILABLE_BUTTONS[type].icon} />
  {/snippet}
</Button>

<Dialog
  title={_('_sui.text_editor.insert_link')}
  bind:open={openDialog}
  okDisabled={!isValidURL}
  okLabel={_('_sui.insert')}
  restoreFocus={false}
  onClose={(event) => {
    onDialogClose(event);
  }}
>
  <div role="none">
    <label for="{id}-url">{_('_sui.text_editor.url')}</label>
    <TextInput
      dir="ltr"
      id="{id}-url"
      bind:value={anchorURL}
      flex
      invalid={!!anchorURL.trim() && !isSafeLinkURL(anchorURL)}
      aria-label={_('_sui.text_editor.url')}
      onkeydown={(event) => {
        onInputKeyDown(event);
      }}
    />
  </div>
  {#if !hasAnchor}
    <div role="none">
      <label for="{id}-text">{_('_sui.text_editor.text')}</label>
      <TextInput
        dir="auto"
        id="{id}-text"
        bind:value={anchorText}
        flex
        aria-label={_('_sui.text_editor.text')}
        onkeydown={(event) => {
          onInputKeyDown(event);
        }}
      />
    </div>
  {/if}
</Dialog>
