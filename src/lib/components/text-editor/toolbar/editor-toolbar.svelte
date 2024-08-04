<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { availableButtons, blockButtonTypes, inlineButtonTypes } from '..';
  import ButtonGroup from '../../button/button-group.svelte';
  import Button from '../../button/button.svelte';
  import Divider from '../../divider/divider.svelte';
  import Spacer from '../../divider/spacer.svelte';
  import Icon from '../../icon/icon.svelte';
  import MenuButton from '../../menu/menu-button.svelte';
  import Menu from '../../menu/menu.svelte';
  import FormatTextButton from './format-text-button.svelte';
  import InsertLinkButton from './insert-link-button.svelte';
  import ToggleBlockMenuItem from './toggle-block-menu-item.svelte';
  import Toolbar from '../../toolbar/toolbar.svelte';

  /**
   * Whether to disable the widget. An alias of the `aria-disabled` attribute.
   * @type {boolean}
   */
  export let disabled = false;
  /**
   * Whether to disable the widget. An alias of `aria-readonly` attribute.
   * @type {boolean}
   */
  export let readonly = false;

  /**
   * Text editor state.
   * @type {TextEditorState}
   */
  const {
    editorId,
    selectionBlockType,
    modes,
    useRichText,
    hasConverterError,
    enabledButtons,
    convertMarkdown,
  } = getContext('state');

  /**
   * Enabled block level buttons.
   */
  $: blockLevelButtons = Array.from(
    new Set(
      /** @type {TextEditorBlockType[]} */ ([
        'paragraph', // Always needed
        ...enabledButtons.filter((type) => blockButtonTypes.includes(/** @type {any} */ (type))),
      ]),
    ),
  );

  /**
   * Enabled inline level buttons.
   */
  $: inlineLevelButtons = Array.from(
    new Set(
      /** @type {TextEditorInlineType[]} */ ([
        ...enabledButtons.filter((type) => inlineButtonTypes.includes(/** @type {any} */ (type))),
      ]),
    ),
  );
</script>

<div role="none" class="wrapper">
  <Toolbar disabled={disabled || readonly} aria-label={$_('_sui.text_editor.text_editor')}>
    <MenuButton
      disabled={!$useRichText}
      aria-label={$_('_sui.text_editor.show_text_style_options')}
      aria-controls="{$editorId}-lexical-root"
    >
      <Icon
        slot="start-icon"
        name={availableButtons[$selectionBlockType]?.icon ?? 'format_paragraph'}
      />
      <Icon slot="end-icon" name="arrow_drop_down" class="small-arrow" />
      <Menu slot="popup" aria-label={$_('_sui.text_editor.text_style_options')}>
        {#each blockLevelButtons as type (type)}
          <ToggleBlockMenuItem {type} />
        {/each}
      </Menu>
    </MenuButton>
    {#if inlineLevelButtons.length}
      <Divider orientation="vertical" />
      <ButtonGroup>
        {#each inlineLevelButtons as type (type)}
          {#if type === 'link'}
            <InsertLinkButton />
          {:else}
            <FormatTextButton {type} />
          {/if}
        {/each}
      </ButtonGroup>
    {/if}
    <Spacer flex />
    {#if modes.length > 1}
      <Button
        iconic
        disabled={$hasConverterError}
        pressed={!$useRichText}
        aria-label={$_('_sui.text_editor.edit_in_markdown')}
        on:click={() => {
          $useRichText = !$useRichText;

          if ($useRichText) {
            convertMarkdown();
          }
        }}
      >
        <Icon slot="start-icon" name="markdown" />
      </Button>
    {/if}
  </Toolbar>
</div>

<style lang="scss">
  .wrapper {
    display: contents;

    :global([role='toolbar']) {
      position: sticky;
      top: 0;
      display: flex;
      gap: 8px;
      border-width: 1px 1px 0;
      border-style: solid;
      border-color: var(--sui-textbox-border-color);
      border-radius: var(--sui-textbox-border-radius) var(--sui-textbox-border-radius) 0 0;
      padding: 8px;
      background-color: var(--sui-tertiary-background-color);
    }

    :global(.sui.menu-button) {
      padding: 0 4px;
    }

    :global(.sui.button) {
      flex: none;
      margin: 0 !important;
    }

    :global(.sui.button-group) {
      gap: 4px;
    }
  }
</style>
