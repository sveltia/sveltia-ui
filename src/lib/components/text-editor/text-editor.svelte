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
    hidden = false,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const editorStore = createEditorStore();

  // svelte-ignore state_referenced_locally
  editorStore.config = {
    ...editorStore.config,
    modes,
    enabledButtons: buttons,
    components,
    useMarkdownShortcuts,
  };

  setContext('editorStore', editorStore);

  $effect(() => {
    if (!editorStore.initialized) {
      return;
    }

    const newValue = value;

    untrack(() => {
      editorStore.inputValue = newValue;
    });
  });

  $effect(() => {
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
    hidden={!editorStore.useRichText || hidden}
    {disabled}
    {readonly}
    {required}
    {invalid}
  />
  <TextArea
    autoResize={true}
    bind:value={editorStore.inputValue}
    {flex}
    {dir}
    hidden={editorStore.useRichText || hidden}
    {disabled}
    {readonly}
    {required}
    {invalid}
  />
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
