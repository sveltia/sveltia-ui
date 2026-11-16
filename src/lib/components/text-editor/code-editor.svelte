<!--
  @component
  A code editor based on Lexical.
-->
<script>
  import { _ } from '@sveltia/i18n';
  import { setContext } from 'svelte';
  import Alert from '../alert/alert.svelte';
  import Toast from '../toast/toast.svelte';
  import { parseCodeBlock, toCodeBlock } from './code-editor.js';
  import LexicalRoot from './lexical-root.svelte';
  import { createEditorStore, syncEditorProps } from './store.svelte.js';
  import CodeLanguageSwitcher from './toolbar/code-language-switcher.svelte';
  import ToolbarWrapper from './toolbar/toolbar-wrapper.svelte';

  /**
   * @import {
   * EditorCommonProps,
   * FormFieldStateProps,
   * WidgetStateProps,
   * } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {string} [code] Input value.
   * @property {string} [lang] Selected language.
   * @property {boolean} [pending] Whether the user has changed the code, and the editor has yet to
   * update {@link code}, which it does a moment later. Bind it to wait for the change before
   * reading the code, for example to save it. Read-only.
   * @property {boolean} [showLanguageSwitcher] Whether to show the language selector.
   */

  /**
   * @type {EditorCommonProps & WidgetStateProps & FormFieldStateProps & Props &
   * Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    code = $bindable(''),
    lang = $bindable('plain'),
    pending = $bindable(false),
    showLanguageSwitcher = false,
    flex = false,
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
    // Not rendered, but kept out of `restProps`, which go on the wrapper element
    children: _children,
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

  editorStore.config = {
    ...editorStore.config,
    useMarkdownShortcuts: false,
    isCodeEditor: true,
    defaultLanguage: lang,
  };

  setContext('editorStore', editorStore);

  syncEditorProps(editorStore, {
    /**
     * Wrap the code in a fenced code block for the editor.
     * @returns {string} Code block.
     */
    getInputValue: () => toCodeBlock(lang, code),
    /**
     * Take the editor’s code block apart into the language and the code.
     * @param {string} inputValue Code block.
     */
    setValue: (inputValue) => {
      const { lang: _lang, code: _code } = parseCodeBlock(inputValue);

      if (lang !== _lang) {
        lang = _lang;
      }

      if (code !== _code) {
        code = _code;
      }
    },
    /**
     * Update the `pending` prop.
     * @param {boolean} newValue New value.
     */
    setPending: (newValue) => {
      pending = newValue;
    },
  });
</script>

<div
  {...restProps}
  role="none"
  class="sui code-editor"
  class:flex
  {hidden}
  style:--sui-text-editor-toolbar-height="{editorStore.toolbarHeight}px"
>
  {#if showLanguageSwitcher}
    <ToolbarWrapper disabled={disabled || readonly} ariaLabel={_('_sui.text_editor.code_editor')}>
      <CodeLanguageSwitcher disabled={disabled || readonly} />
    </ToolbarWrapper>
  {/if}
  <LexicalRoot {...labelAttrs} {hidden} {disabled} {readonly} {required} {invalid} />
</div>

{#if editorStore.showConverterError}
  <Toast bind:show={editorStore.showConverterError}>
    <Alert status="error">{_('_sui.text_editor.converter_error')}</Alert>
  </Toast>
{/if}

<style lang="scss">
  @use '../../styles/mixins';

  .code-editor {
    margin: var(--sui-focus-ring-width);
    width: calc(100% - var(--sui-focus-ring-width) * 2);

    &.flex:not([hidden]) {
      display: block; // Avoid Tailwind .flex class collisions
    }

    @include mixins.nestable-editor;
  }
</style>
