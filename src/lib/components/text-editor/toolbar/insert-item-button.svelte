<script>
  import {
    $createParagraphNode as createParagraphNode,
    $insertNodes as insertNodes,
  } from 'lexical';
  import { getContext } from 'svelte';
  import Button from '../../button/button.svelte';
  import Icon from '../../icon/icon.svelte';

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
  aria-controls="{editorStore.editorId}-lexical-root"
  disabled={!editorStore.useRichText}
  onclick={() => {
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
