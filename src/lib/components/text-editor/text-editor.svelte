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
  import { loadCodeHighlighter } from './core.js';
  import EmojiAutocomplete from './emoji-autocomplete.svelte';
  import LexicalRoot from './lexical-root.svelte';
  import { getBlockType, getRawTextState } from './raw-markdown.js';
  import { highlightCodeToTokens } from './shiki/facade.js';
  import { getCodeTheme, onCodeThemeChange } from './shiki/theme.js';
  import { createEditorStore } from './store.svelte.js';
  import TextEditorToolbar from './toolbar/text-editor-toolbar.svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { TextEditorComponent, TextEditorMode, TextEditorNodeType } from '#lib/typedefs.js';
   * @import { HighlightedToken } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {string} [value] Input value. A value set from outside is kept as is until the user
   * changes the content, although the rich text editor writes Markdown in its own style, such as
   * `_text_` for `*text*`.
   * @property {boolean} [pending] Whether the user has changed the rich text content, and the
   * editor has yet to update {@link value}, which it does a moment later. Bind it to wait for the
   * change before reading the value, for example to save it. Read-only.
   * @property {boolean} [flex] Make the text input container flexible.
   * @property {'ltr' | 'rtl' | 'auto'} [dir] The `dir` attribute on the editable text box, both
   * the rich text editor and the `<textarea>` element of the plain text mode.
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
    pending = $bindable(false),
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

  /**
   * Maximum length of the Markdown source to highlight in the plain text mode. The whole source is
   * tokenized on every keystroke, so highlighting a longer one would make typing sluggish.
   */
  const MAX_HIGHLIGHT_LENGTH = 20_000;

  /** Syntax highlighting theme matching the app’s appearance. */
  let codeTheme = $state(getCodeTheme());
  /** Incremented whenever the highlighter has loaded something, to highlight the text again. */
  let highlighterLoadCount = $state(0);

  const usePlainText = $derived(!editorStore.useRichText && !hidden);
  /**
   * Comma-separated languages used in the fenced code blocks, which are highlighted as well. It’s a
   * string rather than an array, so the highlighter isn’t reloaded on every keystroke.
   */
  const codeLanguages = $derived.by(() => {
    if (!usePlainText || editorStore.inputValue.length > MAX_HIGHLIGHT_LENGTH) {
      return '';
    }

    return [
      ...new Set(
        [...editorStore.inputValue.matchAll(/^[ \t]*(?:```|~~~)[ \t]*(?<lang>[\w+#-]+)/gm)].map(
          ({ groups }) => groups?.lang,
        ),
      ),
    ].join(',');
  });

  /**
   * Highlight the Markdown source in the plain text mode.
   * @param {string} source Markdown source.
   * @returns {HighlightedToken[][] | undefined} Tokens, or `undefined` while the highlighter is
   * still loading.
   */
  const highlightMarkdown = (source) => {
    void highlighterLoadCount;

    // Don’t waste time on tokenizing the source while the rich text mode is shown
    if (!usePlainText || source.length > MAX_HIGHLIGHT_LENGTH) {
      return undefined;
    }

    return highlightCodeToTokens(source, 'markdown', { theme: codeTheme });
  };

  $effect(() =>
    onCodeThemeChange(async () => {
      const theme = getCodeTheme();

      // Keep the current highlighting until the new theme is ready, so the text doesn’t flash
      if (usePlainText) {
        await loadCodeHighlighter('markdown');
      }

      // Ignore an outdated change, in case the appearance has changed again while loading
      if (theme === getCodeTheme()) {
        codeTheme = theme;
      }
    }),
  );

  $effect(() => {
    // Load the highlighter only when the plain text mode is actually shown
    if (!usePlainText) {
      return;
    }

    const languages = codeLanguages ? codeLanguages.split(',') : [];

    void codeTheme;

    untrack(() => {
      // The Markdown grammar is loaded first, because the engine has to be in place before
      // anything else can be loaded
      loadCodeHighlighter('markdown').then(async () => {
        highlighterLoadCount += 1;
        await Promise.all(languages.map((lang) => loadCodeHighlighter(lang)));
        highlighterLoadCount += 1;
      });
    });
  });

  $effect(() => {
    // Keep the block type of the selection up to date in the plain text mode, so the toolbar can
    // reflect it like in the rich text mode
    const { textArea, useRichText } = editorStore;

    if (!textArea || useRichText) {
      return undefined;
    }

    /**
     * Update the selection state. Until the `<textarea>` gets the focus, its caret is at the end of
     * the value rather than where the user would expect, so the block type is not detected yet.
     */
    const update = () => {
      editorStore.selection = {
        blockNodeKey: null,
        blockType:
          document.activeElement === textArea
            ? getBlockType(getRawTextState(textArea))
            : 'paragraph',
        inlineTypes: [],
      };
    };

    const events = ['selectionchange', 'select', 'input', 'keyup', 'mouseup', 'focus'];

    untrack(update);
    events.forEach((type) => textArea.addEventListener(type, update));

    return () => {
      events.forEach((type) => textArea.removeEventListener(type, update));
    };
  });

  $effect(() => {
    pending = editorStore.pending;
  });

  // An editor removed right after a change never converts it, so don’t leave a bound `pending` set
  // for good, which would hold up anything waiting for the change
  $effect(() => () => {
    pending = false;
  });

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
    {dir}
    hidden={!editorStore.useRichText || hidden}
    {disabled}
    {readonly}
    {required}
    {invalid}
  />
  <TextArea
    {...labelAttrs}
    bind:element={editorStore.textArea}
    id="{editorStore.editorId}-plain-text"
    autoResize={true}
    bind:value={editorStore.inputValue}
    {useEmojiAutocomplete}
    highlight={highlightMarkdown}
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
