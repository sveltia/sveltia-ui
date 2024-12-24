<!--
  @component
  A rich text editor based on Lexical.
-->
<script>
  import { generateElementId } from '@sveltia/utils/element';
  import { onMount, setContext, untrack } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { writable } from 'svelte/store';
  import { blockButtonTypes, inlineButtonTypes } from '.';
  import Alert from '../alert/alert.svelte';
  import TextArea from '../text-field/text-area.svelte';
  import Toast from '../toast/toast.svelte';
  import { convertMarkdown as convertMarkdownToLexical, initEditor } from './core';
  import LexicalRoot from './lexical-root.svelte';
  import EditorToolbar from './toolbar/editor-toolbar.svelte';

  /**
   * @typedef {object} Props
   * @property {string} [value] - Input value.
   * @property {boolean} [flex] - Make the text input container flexible.
   * @property {import('$lib/typedefs').TextEditorMode[]} [modes] - Enabled modes.
   * @property {(import('$lib/typedefs').TextEditorBlockType |
   * import('$lib/typedefs').TextEditorInlineType)[]} [buttons] - Enabled buttons.
   * @property {import('$lib/typedefs').TextEditorComponent[]} [components] - Editor components.
   * @property {string} [class] - The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] - Whether to hide the widget.
   * @property {boolean} [disabled] - Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {boolean} [readonly] - Whether to make the widget read-only. An alias of the
   * `aria-readonly` attribute.
   * @property {boolean} [required] - Whether to mark the widget required. An alias of the
   * `aria-required` attribute.
   * @property {boolean} [invalid] - Whether to mark the widget invalid. An alias of the
   * `aria-invalid` attribute.
   * @property {import('svelte').Snippet} [children] - Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    value = $bindable(''),
    flex = false,
    modes = ['rich-text', 'plain-text'],
    buttons = [...inlineButtonTypes, ...blockButtonTypes],
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

  /** @type {import('svelte/store').Writable<import('lexical').LexicalEditor | undefined>} */
  const editor = writable();
  const selectionBlockType = writable('paragraph');
  const selectionInlineTypes = writable([]);
  const editorId = writable(generateElementId('editor'));
  const useRichText = writable(modes[0] === 'rich-text');
  const hasConverterError = writable(false);
  let inputValue = $state('');
  let showConverterError = $state(false);

  /**
   * Convert the Markdown {@link inputValue} to Lexical nodes. Disable the rich text mode and
   * restore the original value when there is an error while conversion.
   */
  const convertMarkdown = async () => {
    if (!$editor?.getRootElement()) {
      return;
    }

    const originalValue = inputValue;

    try {
      await convertMarkdownToLexical($editor, inputValue ?? '');
    } catch (ex) {
      $hasConverterError = true;
      inputValue = originalValue;
      // eslint-disable-next-line no-console
      console.error(ex);
    }
  };

  $effect(() => {
    // We should avoid an empty editor; there should be at least one `<p>`, so give it an empty
    // string if the `value` is `undefined`
    // @see https://github.com/facebook/lexical/issues/2308
    if ($editor?.getEditorState().isEmpty()) {
      convertMarkdownToLexical($editor, '');
    }
  });

  $effect(() => {
    void $editor;

    const newValue = value;

    // Avoid a cycle dependency & infinite loop
    untrack(() => {
      if (inputValue !== newValue) {
        inputValue = newValue ?? '';

        if ($useRichText) {
          convertMarkdown();
        }
      }
    });
  });

  $effect(() => {
    if (!$editor) {
      return;
    }

    const newValue = inputValue;

    // Avoid a cycle dependency & infinite loop
    untrack(() => {
      if (value !== newValue) {
        value = newValue;
      }
    });
  });

  $effect(() => {
    if ($hasConverterError) {
      $useRichText = false;
      showConverterError = true;
    }
  });

  // The editor has to be initialized in the browser
  onMount(() => {
    $editor = initEditor({ components });
  });

  setContext(
    'state',
    /** @type {import('$lib/typedefs').TextEditorState} */ ({
      editor,
      editorId,
      selectionBlockType,
      selectionInlineTypes,
      modes,
      useRichText,
      hasConverterError,
      enabledButtons: buttons,
      components,
      convertMarkdown,
    }),
  );
</script>

<div {...restProps} role="none" class="sui text-editor" {hidden}>
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
