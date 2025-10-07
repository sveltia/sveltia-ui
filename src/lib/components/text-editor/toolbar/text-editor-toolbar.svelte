<script>
  import { unique } from '@sveltia/utils/array';
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import ButtonGroup from '../../button/button-group.svelte';
  import Button from '../../button/button.svelte';
  import Divider from '../../divider/divider.svelte';
  import Spacer from '../../divider/spacer.svelte';
  import Icon from '../../icon/icon.svelte';
  import MenuButton from '../../menu/menu-button.svelte';
  import Menu from '../../menu/menu.svelte';
  import {
    AVAILABLE_BUTTONS,
    BLOCK_BUTTON_TYPES,
    IMAGE_COMPONENT_IDS,
    INLINE_BUTTON_TYPES,
  } from '../constants';
  import CodeLanguageSwitcher from './code-language-switcher.svelte';
  import FormatTextButton from './format-text-button.svelte';
  import InsertImageButton from './insert-image-button.svelte';
  import InsertLinkButton from './insert-link-button.svelte';
  import InsertMenuButton from './insert-menu-button.svelte';
  import ToggleBlockMenuItem from './toggle-block-menu-item.svelte';
  import ToolbarWrapper from './toolbar-wrapper.svelte';

  /**
   * @import { TextEditorBlockType, TextEditorInlineType, TextEditorStore } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {boolean} [hidden] Whether to hide the widget.
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {boolean} [readonly] Whether to make the widget read-only. An alias of the
   * `aria-readonly` attribute.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    disabled = false,
    readonly = false,
    /* eslint-enable prefer-const */
  } = $props();

  /** @type {TextEditorStore} */
  const editorStore = getContext('editorStore');
  const imageComponent = $derived(
    editorStore.config.components.find(({ id }) => IMAGE_COMPONENT_IDS.includes(id)),
  );
  const otherComponents = $derived(
    editorStore.config.components.filter(({ id }) => !IMAGE_COMPONENT_IDS.includes(id)),
  );

  /**
   * Enabled block level buttons.
   * @type {TextEditorBlockType[]}
   */
  const blockLevelButtons = $derived(
    unique([
      'paragraph', // Always needed
      ...editorStore.config.enabledButtons.filter((type) =>
        BLOCK_BUTTON_TYPES.includes(/** @type {any} */ (type)),
      ),
    ]),
  );

  /**
   * Enabled inline level buttons.
   * @type {TextEditorInlineType[]}
   */
  const inlineLevelButtons = $derived(
    unique(
      editorStore.config.enabledButtons.filter((type) =>
        INLINE_BUTTON_TYPES.includes(/** @type {any} */ (type)),
      ),
    ),
  );
</script>

<ToolbarWrapper disabled={disabled || readonly} aria-label={$_('_sui.text_editor.text_editor')}>
  <MenuButton
    disabled={!editorStore.useRichText}
    aria-label={$_('_sui.text_editor.show_text_style_options')}
    aria-controls="{editorStore.editorId}-lexical-root"
  >
    {#snippet startIcon()}
      <Icon
        name={AVAILABLE_BUTTONS[editorStore.selection.blockType ?? '']?.icon ?? 'format_paragraph'}
      />
    {/snippet}
    {#snippet popup()}
      <Menu aria-label={$_('_sui.text_editor.text_style_options')}>
        {#each blockLevelButtons as type (type)}
          <ToggleBlockMenuItem {type} />
        {/each}
      </Menu>
    {/snippet}
  </MenuButton>
  {#if editorStore.selection.blockType === 'code-block'}
    <Divider orientation="vertical" />
    <CodeLanguageSwitcher disabled={!editorStore.useRichText} />
  {:else}
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
    {#if editorStore.config.components.length}
      <Divider orientation="vertical" />
      {#if imageComponent}
        <InsertImageButton component={imageComponent} />
      {/if}
      {#if otherComponents.length}
        <InsertMenuButton components={otherComponents} />
      {/if}
    {/if}
  {/if}
  <Spacer flex />
  {#if editorStore.config.modes.length > 1}
    <Button
      iconic
      disabled={editorStore.hasConverterError}
      pressed={!editorStore.useRichText}
      aria-label={$_('_sui.text_editor.edit_in_markdown')}
      onclick={() => {
        editorStore.useRichText = !editorStore.useRichText;

        if (editorStore.useRichText) {
          editorStore.convertMarkdown();
        }
      }}
    >
      {#snippet startIcon()}
        <Icon name="markdown" />
      {/snippet}
    </Button>
  {/if}
</ToolbarWrapper>
