<script>
  import { LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
  import { $getNearestNodeOfType as getNearestNodeOfType } from '@lexical/utils';
  import { generateElementId } from '@sveltia/utils/element';
  import {
    COMMAND_PRIORITY_NORMAL,
    KEY_DOWN_COMMAND,
    $getPreviousSelection as getPreviousSelection,
    $getSelection as getSelection,
    $getTextContent as getTextContent,
    $isRangeSelection as isRangeSelection,
  } from 'lexical';
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { availableButtons } from '..';
  import { isMac, matchShortcuts } from '../../../services/events.svelte';
  import Button from '../../button/button.svelte';
  import Dialog from '../../dialog/dialog.svelte';
  import Icon from '../../icon/icon.svelte';
  import TextInput from '../../text-field/text-input.svelte';

  const id = generateElementId('insert-link');

  /**
   * Button type.
   */
  const type = 'link';

  /**
   * Text editor state.
   * @type {import('$lib/typedefs').TextEditorState}
   */
  const { editor, editorId, selectionInlineTypes, useRichText } = getContext('state');

  let openDialog = $state(false);
  /** @type {'create' | 'update' | 'remove'} */
  let dialogMode = $state('create');
  let hasAnchor = $state(false);
  let anchorURL = $state('');
  let anchorText = $state('');

  /**
   * Create a new link by showing a dialog to accept a URL and optionally text.
   */
  const createLink = () => {
    $editor.getEditorState().read(() => {
      const textContent = getTextContent().trim();

      anchorURL = textContent;
      hasAnchor = !!textContent;
      dialogMode = 'create';
      openDialog = true;
    });
  };

  /**
   * Remove an existing link.
   */
  const removeLink = () => {
    $editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
  };

  /**
   * Update an existing link.
   */
  const updateLink = () => {
    $editor.getEditorState().read(() => {
      const selection = getSelection();

      if (isRangeSelection(selection)) {
        const anchor = selection.anchor.getNode();
        const parent = anchor instanceof LinkNode ? anchor : getNearestNodeOfType(anchor, LinkNode);
        const url = parent?.getURL();

        if (url) {
          hasAnchor = true;
          anchorURL = url;
          dialogMode = 'update';
          openDialog = true;

          return;
        }
      }

      // Can’t update for some reason; remove it
      removeLink();
    });
  };

  /**
   * Handle `click` event fired on the Link button. If a link is selected, update it. Otherwise,
   * create a new link.
   */
  const onButtonClick = () => {
    if ($selectionInlineTypes.includes(type)) {
      updateLink();
    } else {
      createLink();
    }
  };

  /**
   * Handle `keydown` event fired on the input fields on the dialog.
   * @param {KeyboardEvent} event - `keydown` event.
   */
  const onInputKeyDown = (event) => {
    if (matchShortcuts(event, 'Enter') && anchorURL) {
      openDialog = false;
    }
  };

  /**
   * Handle `close` event fired on the dialog. Insert a link with the given URL and optionally text.
   * @param {CustomEvent} event - `close` event.
   * @see https://github.com/facebook/lexical/discussions/3013
   */
  const onDialogClose = async (event) => {
    if (event.detail !== 'cancel' && dialogMode !== 'remove') {
      if (!hasAnchor) {
        anchorText = anchorText.trim();
        anchorText ||= anchorURL;

        await new Promise((resolve) => {
          $editor.update(() => {
            const selection = getSelection() ?? getPreviousSelection()?.clone();

            if (isRangeSelection(selection)) {
              const { anchor, focus } = selection;

              selection.insertText(anchorText);
              anchor.offset -= anchorText.length;
              focus.offset = anchor.offset + anchorText.length;

              resolve(void 0);
            }
          });
        });
      }

      $editor.dispatchCommand(TOGGLE_LINK_COMMAND, anchorURL);
    }

    anchorURL = '';
    anchorText = '';
  };

  /**
   * Open the dialog with a keyboard shortcut: Accel+K.
   */
  const _registerCommand = () => {
    $editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        if (matchShortcuts(event, isMac() ? 'Meta+K' : 'Ctrl+K')) {
          event.preventDefault();
          onButtonClick();
        }

        return false;
      },
      COMMAND_PRIORITY_NORMAL,
    );
  };

  $effect(() => {
    if ($editor) {
      _registerCommand();
    }
  });
</script>

<Button
  iconic
  aria-label={$_(`_sui.text_editor.${availableButtons[type].labelKey}`)}
  aria-controls="{$editorId}-lexical-root"
  disabled={!$useRichText}
  pressed={$selectionInlineTypes.includes(type)}
  onclick={() => {
    onButtonClick();
  }}
>
  {#snippet startIcon()}
    <Icon name={availableButtons[type].icon} />
  {/snippet}
</Button>

<Dialog
  title={dialogMode === 'create'
    ? $_('_sui.text_editor.insert_link')
    : $_('_sui.text_editor.update_link')}
  bind:open={openDialog}
  bind:value={anchorURL}
  okDisabled={!anchorURL}
  okLabel={dialogMode === 'create' ? $_('_sui.insert') : $_('_sui.update')}
  onClose={(event) => {
    onDialogClose(event);
  }}
>
  {#if !hasAnchor}
    <div role="none">
      <label for="{id}-text">{$_('_sui.text_editor.text')}</label>
      <TextInput
        id="{id}-text"
        autofocus
        bind:value={anchorText}
        flex
        onkeydown={(event) => {
          onInputKeyDown(event);
        }}
      />
    </div>
  {/if}
  <div role="none">
    <label for="{id}-url">{$_('_sui.text_editor.url')}</label>
    <TextInput
      id="{id}-url"
      autofocus={hasAnchor || undefined}
      bind:value={anchorURL}
      flex
      aria-label="URL"
      onkeydown={(event) => {
        onInputKeyDown(event);
      }}
    />
  </div>
  {#snippet footerExtra()}
    {#if dialogMode !== 'create'}
      <Button
        variant="secondary"
        label={$_('_sui.remove')}
        onclick={() => {
          removeLink();
          dialogMode = 'remove';
          openDialog = false;
        }}
      />
    {/if}
  {/snippet}
</Dialog>
