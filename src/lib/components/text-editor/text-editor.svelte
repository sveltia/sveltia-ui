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
  import FloatingLinkEditor from './floating-link-editor.svelte';
  import LexicalRoot from './lexical-root.svelte';
  import TableCellMenuButton from './table-cell-menu-button.svelte';
  import { getBlockType, getRawTextState, registerRawTextSingleLine } from './raw-markdown.js';
  import { highlightCodeToTokens } from './shiki/facade.js';
  import { getCodeTheme, onCodeThemeChange } from './shiki/theme.js';
  import { createEditorStore } from './store.svelte.js';
  import TextEditorToolbar from './toolbar/text-editor-toolbar.svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import {
   * TextEditorComponent,
   * TextEditorMode,
   * TextEditorNodeType,
   * TextEditorValueFormat,
   * } from '#lib/typedefs.js';
   * @import { HighlightedToken } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {string} [value] Input value in the {@link format}. A value set from outside
   * is kept as is until the user changes the content, although the rich text editor writes Markdown
   * or HTML in its own style, such as `_text_` for `*text*` or `<strong>` for `<b>`.
   * @property {TextEditorValueFormat} [format] Format of the {@link value}: `markdown` or `html`.
   * With `html`, the plain text mode shows the HTML source, and editor components have to
   * implement `importDOM` and `exportDOM` for their nodes. HTML with an element the editor cannot
   * handle, like `<img>`, can only be edited in the plain text mode. Attributes not used by the
   * editor, like `class`, are dropped once the content is changed in the rich text mode.
   * @property {boolean} [pending] Whether the user has changed the rich text content, and the
   * editor has yet to update {@link value}, which it does a moment later. Bind it to wait for the
   * change before reading the value, for example to save it. Read-only.
   * @property {boolean} [flex] Make the text input container flexible.
   * @property {'ltr' | 'rtl' | 'auto'} [dir] The `dir` attribute on the editable text box, both
   * the rich text editor and the `<textarea>` element of the plain text mode.
   * @property {TextEditorMode[]} [modes] Enabled modes.
   * @property {TextEditorNodeType[]} [buttons] Enabled buttons.
   * @property {TextEditorComponent[]} [components] Editor components.
   * @property {boolean} [multiline] Whether the content can span multiple paragraphs and lines.
   * With `false`, the content is kept in a single paragraph: the Enter key does nothing, and the
   * paragraphs and lines of pasted or imported content are joined with spaces. Only the inline
   * buttons and the editor components with a text match transformer are enabled then, horizontal
   * rules and tables in Markdown are kept as text, and the HTML format has no plain text mode.
   * @property {boolean} [minimal] Whether to make the editor compact: it starts with the height of
   * a single line, like a single-line editor, and stops growing at 240 pixels, scrolling the
   * content beyond that.
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
    format = 'markdown',
    flex = false,
    dir = undefined,
    modes = ['rich-text', 'plain-text'],
    buttons = [...INLINE_BUTTON_TYPES, ...BLOCK_BUTTON_TYPES],
    components = [],
    multiline = true,
    minimal = false,
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
    multiline,
    useMarkdownShortcuts,
    useEmojiAutocomplete,
    format,
  };

  setContext('editorStore', editorStore);

  /** Language of the source shown in the plain text mode. */
  // svelte-ignore state_referenced_locally
  const sourceLanguage = format === 'html' ? 'html' : 'markdown';

  /**
   * Maximum length of the Markdown or HTML source to highlight in the plain text mode. The whole
   * source is tokenized on every keystroke, so highlighting a longer one would make typing
   * sluggish.
   */
  const MAX_HIGHLIGHT_LENGTH = 20_000;

  /** Syntax highlighting theme matching the app’s appearance. */
  let codeTheme = $state(getCodeTheme());
  /** Incremented whenever the highlighter has loaded something, to highlight the text again. */
  let highlighterLoadCount = $state(0);

  const usePlainText = $derived(!editorStore.useRichText && !hidden);
  /**
   * The `dir` attribute on the `<textarea>` of the plain text mode. The rich text mode keeps the
   * hidden `<textarea>` in sync with the editor, setting its value on every change, and the browser
   * resolves `dir="auto"` over the whole value each time it’s set, which makes typing in a long
   * document slow. As nobody sees the `<textarea>` meanwhile, it only gets `auto` once it’s shown.
   */
  const textAreaDir = $derived(dir === 'auto' && editorStore.useRichText ? undefined : dir);
  /**
   * Comma-separated languages used in the fenced code blocks of the Markdown source, which are
   * highlighted as well. It’s a string rather than an array, so the highlighter isn’t reloaded on
   * every keystroke.
   */
  const codeLanguages = $derived.by(() => {
    if (
      !usePlainText ||
      sourceLanguage !== 'markdown' ||
      editorStore.inputValue.length > MAX_HIGHLIGHT_LENGTH
    ) {
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
   * Highlight the Markdown or HTML source in the plain text mode.
   * @param {string} source Markdown or HTML source.
   * @returns {HighlightedToken[][] | undefined} Tokens, or `undefined` while the highlighter is
   * still loading.
   */
  const highlightSource = (source) => {
    void highlighterLoadCount;

    // Don’t waste time on tokenizing the source while the rich text mode is shown
    if (!usePlainText || source.length > MAX_HIGHLIGHT_LENGTH) {
      return undefined;
    }

    return highlightCodeToTokens(source, sourceLanguage, { theme: codeTheme });
  };

  $effect(() =>
    onCodeThemeChange(async () => {
      const theme = getCodeTheme();

      // Keep the current highlighting until the new theme is ready, so the text doesn’t flash
      if (usePlainText) {
        await loadCodeHighlighter(sourceLanguage);
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
      // The Markdown or HTML grammar is loaded first, because the engine has to be in place before
      // anything else can be loaded
      loadCodeHighlighter(sourceLanguage).then(async () => {
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
    const { textArea } = editorStore;

    if (!textArea || multiline) {
      return undefined;
    }

    return registerRawTextSingleLine(textArea);
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

<div
  {...restProps}
  role="none"
  class="sui text-editor"
  class:flex
  class:single-line={!multiline}
  class:minimal
  {hidden}
  style:--sui-text-editor-toolbar-height="{editorStore.toolbarHeight}px"
>
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
    rows={multiline ? undefined : 1}
    aria-multiline={multiline ? undefined : false}
    bind:value={editorStore.inputValue}
    {useEmojiAutocomplete}
    highlight={highlightSource}
    {flex}
    dir={textAreaDir}
    hidden={editorStore.useRichText || hidden}
    {disabled}
    {readonly}
    {required}
    {invalid}
  />
  {#if editorStore.config.useEmojiAutocomplete && !disabled && !readonly}
    <EmojiAutocomplete />
  {/if}
  {#if editorStore.config.enabledButtons.includes('link') && !disabled && !readonly}
    <FloatingLinkEditor />
  {/if}
  {#if editorStore.config.enabledButtons.includes('table') && !disabled && !readonly}
    <TableCellMenuButton />
  {/if}
</div>

{#if editorStore.showConverterError}
  <Toast bind:show={editorStore.showConverterError}>
    <Alert status="error">{_('_sui.text_editor.converter_error')}</Alert>
  </Toast>
{/if}

<style lang="scss">
  @use '../../styles/mixins';

  .text-editor {
    // The button on the selected table cell is positioned against this
    position: relative;
    margin: var(--sui-focus-ring-width);
    width: calc(100% - var(--sui-focus-ring-width) * 2);

    &.flex:not([hidden]) {
      display: block; // Avoid Tailwind .flex class collisions
    }

    // The rules below only apply to the editor’s own boxes, not to those of the editors and fields
    // nested in its editor components, hence the child combinators

    // Fit a single line of text, rather than the room a multiline editor starts with
    &:is(.single-line, .minimal) {
      :global {
        > .lexical-root,
        > .text-area > :is(textarea, .clone) {
          min-height: 0;
        }
      }
    }

    &.minimal {
      :global {
        // Stop growing at a certain height, and scroll the content beyond it. The highlighted
        // clone of the plain text mode is capped too, so it doesn’t make the box taller, and
        // scrolls along
        > .lexical-root,
        > .text-area > :is(textarea, .clone) {
          max-height: 240px;
        }

        > .lexical-root,
        > .text-area > textarea {
          overflow: auto;
        }

        // The editor is the scroll container of nested editors now, so their sticky toolbars stick
        // to its top rather than below this editor’s toolbar
        > .lexical-root {
          --sui-text-editor-inner-toolbar-top: 0px;
        }

        // Reserve the room for the scrollbar the `<textarea>` gets once it’s capped, so the
        // highlighted clone wraps the lines at the same place
        > .text-area > :is(textarea, .clone) {
          scrollbar-gutter: stable;
        }
      }
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
          // Draw the focus ring inside the box, like the rich text editor does, as the toolbar
          // right above would cover its top edge otherwise. It’s set while not focused too, so
          // the ring doesn’t slide into place as the `<textarea>` transitions all its properties
          outline-offset: calc(var(--sui-focus-ring-width) * -1);
        }
      }
    }

    @include mixins.nestable-editor;
  }
</style>
