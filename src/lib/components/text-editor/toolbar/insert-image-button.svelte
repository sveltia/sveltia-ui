<script>
  import {
    $createParagraphNode as createParagraphNode,
    $insertNodes as insertNodes,
  } from 'lexical';
  import { getContext } from 'svelte';
  import Button from '../../button/button.svelte';
  import Icon from '../../icon/icon.svelte';

  /**
   * @typedef {object} Props
   * @property {import('$lib/typedefs').TextEditorComponent} component - Image editor component.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    component,
    /* eslint-enable prefer-const */
  } = $props();

  /** @type {import('$lib/typedefs').TextEditorStore} */
  const editorStore = getContext('editorStore');
</script>

<Button
  iconic
  aria-label={component.label}
  aria-controls="{editorStore.editorId}-lexical-root"
  disabled={!editorStore.useRichText}
  onclick={() => {
    editorStore.editor?.update(() => {
      insertNodes([component.createNode(), createParagraphNode()]);
    });
  }}
>
  {#snippet startIcon()}
    <Icon name={component.icon} />
  {/snippet}
</Button>
