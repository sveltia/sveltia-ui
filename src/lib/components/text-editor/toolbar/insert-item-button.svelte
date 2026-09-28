<script>
  import {
    $createParagraphNode as createParagraphNode,
    $insertNodes as insertNodes,
  } from 'lexical';
  import { getContext } from 'svelte';
  import Button from '../../button/button.svelte';
  import Icon from '../../icon/icon.svelte';
  import { insertComponent } from '../raw-markdown.js';

  /**
   * @import { TextEditorComponent, TextEditorStore } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {TextEditorComponent} component Editor component.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    component,
    /* eslint-enable prefer-const */
  } = $props();

  /** @type {TextEditorStore} */
  const editorStore = getContext('editorStore');

  const { label, icon, createNode } = $derived(component);
</script>

<Button
  iconic={!!icon}
  label={icon ? undefined : label}
  title={label}
  aria-label={label}
  aria-controls={editorStore.controlId}
  onclick={() => {
    const { textArea, useRichText } = editorStore;

    // Insert the component’s Markdown in the plain text mode
    if (!useRichText) {
      // The button is only enabled while the `<textarea>` is there
      /* v8 ignore else */
      if (textArea) {
        insertComponent(textArea, component);
      }

      return;
    }

    editorStore.editor?.update(() => {
      // Add an additional paragraph for easier editing
      insertNodes([createNode(), createParagraphNode()]);
    });
  }}
>
  {#snippet startIcon()}
    {#if icon}
      <Icon name={icon} />
    {/if}
  {/snippet}
</Button>
