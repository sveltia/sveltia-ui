<!--
  @component
  A rich text editor based on Lexical.
-->
<script>
  import { setContext, untrack } from 'svelte';
  import { _ } from 'svelte-i18n';
  import Alert from '../alert/alert.svelte';
  import TextArea from '../text-field/text-area.svelte';
  import Toast from '../toast/toast.svelte';
  import { BLOCK_BUTTON_TYPES, INLINE_BUTTON_TYPES } from './constants';
  import LexicalRoot from './lexical-root.svelte';
  import { createEditorStore } from './store.svelte';
  import TextEditorToolbar from './toolbar/text-editor-toolbar.svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import {
   * TextEditorBlockType,
   * TextEditorComponent,
   * TextEditorInlineType,
   * TextEditorMode,
   * } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {string} [value] Input value.
   * @property {boolean} [flex] Make the text input container flexible.
   * @property {TextEditorMode[]} [modes] Enabled modes.
   * @property {(TextEditorBlockType | TextEditorInlineType)[]} [buttons] Enabled buttons.
   * @property {TextEditorComponent[]} [components] Editor components.
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
    modes = ['rich-text', 'plain-text'],
    buttons = [...INLINE_BUTTON_TYPES, ...BLOCK_BUTTON_TYPES],
    components = [],
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

  editorStore.config = { ...editorStore.config, modes, enabledButtons: buttons, components };

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
    hidden={editorStore.useRichText || hidden}
    {disabled}
    {readonly}
    {required}
    {invalid}
  />
</div>

{#if editorStore.showConverterError}
  <Toast bind:show={editorStore.showConverterError}>
    <Alert status="error">{$_('_sui.text_editor.converter_error')}</Alert>
  </Toast>
{/if}

<style lang="scss">
  .text-editor {
    margin: var(--sui-focus-ring-width);
    width: calc(100% - var(--sui-focus-ring-width) * 2);

    :global {
      .sui.text-area {
        margin: 0 !important;
        width: 100% !important;
        min-width: auto;

        textarea {
          border-radius: //
            0 0 var(--sui-textbox-border-radius) var(--sui-textbox-border-radius) !important;
        }
      }
    }
  }
</style>
