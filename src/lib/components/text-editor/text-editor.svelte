<!--
  @component
  A rich text editor based on Lexical.
-->
<script>
  import { generateElementId } from '@sveltia/utils/element';
  import { setContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { writable } from 'svelte/store';
  import Alert from '$lib/components/alert/alert.svelte';
  import { blockButtonTypes, inlineButtonTypes } from '$lib/components/text-editor';
  import {
    convertMarkdown as convertMarkdownToLexical,
    initEditor,
  } from '$lib/components/text-editor/core';
  import LexicalRoot from '$lib/components/text-editor/lexical-root.svelte';
  import EditorToolbar from '$lib/components/text-editor/toolbar/editor-toolbar.svelte';
  import TextArea from '$lib/components/text-field/text-area.svelte';
  import Toast from '$lib/components/toast/toast.svelte';

  /**
   * Make the text input container flexible.
   * @type {boolean}
   */
  export let flex = false;
  /**
   * Whether to hide the widget. An alias of the `aria-hidden` attribute.
   * @type {boolean | undefined}
   */
  export let hidden = undefined;
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
   * Whether to mark the widget required. An alias of the `aria-required` attribute.
   * @type {boolean}
   */
  export let required = false;
  /**
   * Whether to mark the widget invalid. An alias of the `aria-invalid` attribute.
   * @type {boolean}
   */
  export let invalid = false;
  /**
   * Input value.
   * @type {string | undefined}
   */
  export let value = undefined;
  /**
   * Enabled modes.
   * @type {TextEditorMode[]}
   */
  export let modes = ['rich-text', 'plain-text'];
  /**
   * Enabled buttons.
   * @type {(TextEditorBlockType | TextEditorInlineType)[]}
   */
  export let buttons = [...inlineButtonTypes, ...blockButtonTypes];

  const editor = writable(initEditor());
  const selectionBlockType = writable('paragraph');
  const selectionInlineTypes = writable([]);
  const editorId = writable(generateElementId('editor'));
  const useRichText = writable(modes[0] === 'rich-text');
  const hasConverterError = writable(false);
  let inputValue = '';
  let showConverterError = false;

  /**
   * Convert the Markdown {@link inputValue} to Lexical nodes. Disable the rich text mode and
   * restore the original value when there is an error while conversion.
   */
  const convertMarkdown = async () => {
    const originalValue = inputValue;

    try {
      // We should avoid an empty editor; there should be at least one `<p>`, so give it an empty
      // string if the `value` is `undefined`
      // @see https://github.com/facebook/lexical/issues/2308
      await convertMarkdownToLexical($editor, inputValue ?? '');
    } catch {
      $hasConverterError = true;
      inputValue = originalValue;
    }
  };

  /**
   * Update {@link inputValue} based on {@link value}.
   */
  const setInputValue = () => {
    const newValue = value ?? '';

    // Avoid a cycle dependency & infinite loop
    if (inputValue !== newValue) {
      inputValue = newValue;

      if ($useRichText) {
        convertMarkdown();
      }
    }
  };

  /**
   * Update {@link value} based on {@link inputValue}.
   */
  const setCurrentValue = () => {
    const newValue = inputValue;

    // Avoid a cycle dependency & infinite loop
    if (value !== newValue) {
      value = newValue;
    }
  };

  $: {
    void value;
    setInputValue();
  }

  $: {
    void inputValue;
    setCurrentValue();
  }

  $: {
    if ($hasConverterError) {
      $useRichText = false;
      showConverterError = true;
    }
  }

  setContext(
    'state',
    /** @type {TextEditorState} */ ({
      editor,
      editorId,
      selectionBlockType,
      selectionInlineTypes,
      modes,
      useRichText,
      hasConverterError,
      enabledButtons: buttons,
      convertMarkdown,
    }),
  );
</script>

<div role="none" class="sui text-editor" hidden={hidden || undefined} {...$$restProps}>
  <EditorToolbar {disabled} {readonly} />
  <LexicalRoot
    bind:value={inputValue}
    hidden={!$useRichText || hidden}
    {disabled}
    {readonly}
    {required}
    {invalid}
  />
  <TextArea
    autoResize={true}
    bind:value={inputValue}
    {flex}
    hidden={$useRichText || hidden}
    {disabled}
    {readonly}
    {required}
    {invalid}
  />
</div>

{#if showConverterError}
  <Toast bind:show={showConverterError}>
    <Alert status="error">{$_('_sui.text_editor.converter_error')}</Alert>
  </Toast>
{/if}

<style lang="scss">
  .text-editor {
    margin: var(--sui-focus-ring-width);
    width: calc(100% - var(--sui-focus-ring-width) * 2);

    :global(.sui.text-area) {
      margin: 0 !important;
      width: 100% !important;
      min-width: auto;

      :global(textarea) {
        border-radius: //
          0 0 var(--sui-textbox-border-radius) var(--sui-textbox-border-radius) !important;
      }
    }
  }
</style>
