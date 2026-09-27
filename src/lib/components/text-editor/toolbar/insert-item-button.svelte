<script>
  import {
    $createParagraphNode as createParagraphNode,
    $insertNodes as insertNodes,
  } from 'lexical';
  import { getContext } from 'svelte';
  import Button from '../../button/button.svelte';
  import Icon from '../../icon/icon.svelte';
  import InsertComponentDialog from './insert-component-dialog.svelte';

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

  let openDialog = $state(false);
</script>

<Button
  iconic={!!icon}
  label={icon ? undefined : label}
  title={label}
  aria-label={label}
  aria-controls={editorStore.controlId}
  onclick={() => {
    // The plain text mode needs a dialog to fill in the component’s fields
    if (!editorStore.useRichText) {
      openDialog = true;

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

<InsertComponentDialog {component} bind:open={openDialog} />
