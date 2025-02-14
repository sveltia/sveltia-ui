<!--
  @component
  A code editor based on Lexical.
-->
<script>
  import { setContext, untrack } from 'svelte';
  import { _ } from 'svelte-i18n';
  import Alert from '../alert/alert.svelte';
  import Toast from '../toast/toast.svelte';
  import LexicalRoot from './lexical-root.svelte';
  import { createEditorStore } from './store.svelte';
  import CodeEditorToolbar from './toolbar/code-editor-toolbar.svelte';

  /**
   * @typedef {object} Props
   * @property {string} [code] - Input value.
   * @property {string} [lang] - Selected language.
   * @property {boolean} [showLanguageSwitcher] - Whether to show the language selector.
   * @property {boolean} [flex] - Make the text input container flexible.
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
    code = $bindable(''),
    lang = $bindable(''),
    showLanguageSwitcher = false,
    flex = false,
    hidden = false,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const backticks = '```';
  const editorStore = createEditorStore();

  editorStore.config.isCodeEditor = true;
  editorStore.config.defaultLanguage = lang;

  setContext('editorStore', editorStore);

  $effect(() => {
    if (!editorStore.initialized) {
      return;
    }

    void code;
    void lang;

    untrack(() => {
      const newValue = code
        ? `${backticks}${lang}\n${code}\n${backticks}`
        : `${backticks}${lang}\n${backticks}`;

      editorStore.inputValue = newValue;
    });
  });

  $effect(() => {
    if (!editorStore.initialized) {
      return;
    }

    void editorStore.inputValue;

    untrack(() => {
      const { lang: _lang = '', code: _code = '' } =
        editorStore.inputValue.match(/^```(?<lang>\w+?)?\n(?:(?<code>.*)\n)?```/s)?.groups ?? {};

      if (lang !== _lang) {
        lang = _lang;
      }

      if (code !== _code) {
        code = _code;
      }
    });
  });
</script>

<div {...restProps} role="none" class="sui code-editor" class:flex {hidden}>
  {#if showLanguageSwitcher}
    <CodeEditorToolbar {disabled} {readonly} />
  {/if}
  <LexicalRoot
    hidden={!editorStore.useRichText || hidden}
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
  .code-editor {
    margin: var(--sui-focus-ring-width);
    width: calc(100% - var(--sui-focus-ring-width) * 2);
  }
</style>
