<!--
  @component
  A minimal rich text editor holding a single editor component, so it can be edited with its own
  field UI outside the main editor, and exported to Markdown. Used to insert a component in the
  plain text mode.
-->
<script>
  import {
    $createParagraphNode as createParagraphNode,
    $getRoot as getRoot,
    $insertNodes as insertNodes,
  } from 'lexical';
  import { getContext, setContext } from 'svelte';
  import { onEditorUpdate } from '../core.js';
  import LexicalRoot from '../lexical-root.svelte';
  import { createEditorStore } from '../store.svelte.js';

  /**
   * @import { TextEditorComponent, TextEditorStore } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {TextEditorComponent} component Editor component to edit.
   * @property {string} [markdown] Markdown output of the component.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    component,
    markdown = $bindable(''),
    /* eslint-enable prefer-const */
  } = $props();

  /** @type {TextEditorStore} */
  const parentStore = getContext('editorStore');
  const editorStore = createEditorStore();

  // svelte-ignore state_referenced_locally
  editorStore.config = {
    ...parentStore.config,
    modes: ['rich-text'],
    components: [component],
    useMarkdownShortcuts: false,
    useEmojiAutocomplete: false,
  };

  setContext('editorStore', editorStore);

  let inserted = false;

  $effect(() => {
    const { editor, initialized } = editorStore;

    if (!editor || !initialized || inserted) {
      return;
    }

    inserted = true;

    editor.update(() => {
      const paragraph = createParagraphNode();

      getRoot().clear().append(paragraph);
      paragraph.select();
      insertNodes([component.createNode()]);
    });
  });

  $effect(() => {
    markdown = editorStore.inputValue.trim();
  });

  /**
   * Get the component’s Markdown right now. The bound `markdown` is only updated after a short
   * delay, so it may not reflect a field that has just been changed.
   * @returns {string} Markdown.
   */
  export const getMarkdown = () => {
    const { editor, enabledTransformers } = editorStore;

    // The dialog can only be submitted once the editor is there
    /* v8 ignore next 3 */
    if (!editor) {
      return markdown;
    }

    return editor
      .getEditorState()
      .read(() => onEditorUpdate(editor, enabledTransformers))
      .trim();
  };
</script>

<LexicalRoot aria-label={component.label} />
