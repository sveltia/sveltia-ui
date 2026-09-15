<!--
  @component
  A rich text editor based on Lexical.
-->
<script>
  import { _ } from '@sveltia/i18n';
  import { setContext, untrack } from 'svelte';
  import Alert from '../alert/alert.svelte';
  import TextArea from '../text-field/text-area.svelte';
  import Toast from '../toast/toast.svelte';
  import { BLOCK_BUTTON_TYPES, INLINE_BUTTON_TYPES } from './constants.js';
  import EmojiAutocomplete from './emoji-autocomplete.svelte';
  import LexicalRoot from './lexical-root.svelte';
  import { createEditorStore } from './store.svelte.js';
  import TextEditorToolbar from './toolbar/text-editor-toolbar.svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { TextEditorComponent, TextEditorMode, TextEditorNodeType } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {string} [value] Input value.
   * @property {boolean} [flex] Make the text input container flexible.
   * @property {'ltr' | 'rtl' | 'auto'} [dir] The `dir` attribute on the `<textarea>` element.
   * @property {TextEditorMode[]} [modes] Enabled modes.
   * @property {TextEditorNodeType[]} [buttons] Enabled buttons.
   * @property {TextEditorComponent[]} [components] Editor components.
   * @property {boolean} [useMarkdownShortcuts] Whether to enable Markdown keyboard shortcuts in the
   * rich text editor.
   * @property {boolean} [useEmojiAutocomplete] Whether to autocomplete emojis when the user
   * types a shortcode, like `:smi`.
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] Whether to hide the widget.
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {boolean} [readonly] Whether to make the widget read-only. An alias of the
   * `aria-readonly` attribute.
   * @property {boolean} [required] Whether to mark the widget required. An alias of the
   * `aria-required` attribute.
   * @property {boolean} [invalid] Whether to mark the widget invalid. An alias of the
   * `aria-invalid` attribute.
   * @property {string} [ariaLabel] The `aria-label` attribute on the editable text box. Either
   * this or `ariaLabelledby` is required for the editor to have an accessible name.
   * @property {string} [ariaLabelledby] The `aria-labelledby` attribute on the editable text box.
   * @property {string} [ariaDescribedby] The `aria-describedby` attribute on the editable text
   * box.
   * @property {Snippet} [children] Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    value = $bindable(''),
    flex = false,
    dir = undefined,
    modes = ['rich-text', 'plain-text'],
    buttons = [...INLINE_BUTTON_TYPES, ...BLOCK_BUTTON_TYPES],
    components = [],
    useMarkdownShortcuts = true,
    useEmojiAutocomplete = true,
    hidden = false,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    ariaLabel = undefined,
    ariaLabelledby = undefined,
    ariaDescribedby = undefined,
    'aria-label': ariaLabelAttr = undefined,
    'aria-labelledby': ariaLabelledbyAttr = undefined,
    'aria-describedby': ariaDescribedbyAttr = undefined,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * Labelling attributes for the editable text box. They’re pulled out of `restProps` because the
   * rest goes on the presentational wrapper, where ARIA would ignore them.
   */
  const labelAttrs = $derived({
    'aria-label': ariaLabel ?? ariaLabelAttr,
    'aria-labelledby': ariaLabelledby ?? ariaLabelledbyAttr,
    'aria-describedby': ariaDescribedby ?? ariaDescribedbyAttr,
  });

  const editorStore = createEditorStore();

  // svelte-ignore state_referenced_locally
  editorStore.config = {
    ...editorStore.config,
    modes,
    enabledButtons: buttons,
    components,
    useMarkdownShortcuts,
    useEmojiAutocomplete,
  };

  setContext('editorStore', editorStore);

  $effect(() => {
    // The root initializes the editor before these effects first run, and stays initialized
    /* v8 ignore next */
    if (!editorStore.initialized) {
      return;
    }

    const newValue = value;

    untrack(() => {
      editorStore.inputValue = newValue;
    });
  });

  $effect(() => {
    // The root initializes the editor before these effects first run, and stays initialized
    /* v8 ignore next */
    if (!editorStore.initialized) {
      return;
    }

    const newValue = editorStore.inputValue;

    untrack(() => {
      if (value !== newValue) {
        value = newValue;
      }
    });
  });
</script>

<div {...restProps} role="none" class="sui text-editor" class:flex {hidden}>
  <TextEditorToolbar {disabled} {readonly} />
  <LexicalRoot
    {...labelAttrs}
    hidden={!editorStore.useRichText || hidden}
    {disabled}
    {readonly}
    {required}
    {invalid}
  />
  <TextArea
    {...labelAttrs}
    autoResize={true}
    bind:value={editorStore.inputValue}
    {useEmojiAutocomplete}
    {flex}
    {dir}
    hidden={editorStore.useRichText || hidden}
    {disabled}
    {readonly}
    {required}
    {invalid}
  />
  {#if editorStore.config.useEmojiAutocomplete && !disabled && !readonly}
    <EmojiAutocomplete />
  {/if}
</div>

{#if editorStore.showConverterError}
  <Toast bind:show={editorStore.showConverterError}>
    <Alert status="error">{_('_sui.text_editor.converter_error')}</Alert>
  </Toast>
{/if}

<style lang="scss">
  .text-editor {
    margin: var(--sui-focus-ring-width);
    border-radius: var(--sui-textbox-border-radius);
    width: calc(100% - var(--sui-focus-ring-width) * 2);
    transition: all 200ms;

    &:focus-within {
      outline: var(--sui-focus-ring-width) solid var(--sui-focus-ring-color);
    }

    &.flex:not([hidden]) {
      display: block; // Avoid Tailwind .flex class collisions
    }

    :global {
      .sui.text-area {
        margin: 0 !important;
        width: 100% !important;
        min-width: auto;

        textarea {
          border-start-start-radius: 0 !important;
          border-start-end-radius: 0 !important;
          border-end-start-radius: var(--sui-textbox-border-radius) !important;
          border-end-end-radius: var(--sui-textbox-border-radius) !important;
        }
      }
    }
  }
</style>
