<script>
  import { getContext } from 'svelte';
  import Button from '../../button/button.svelte';
  import Icon from '../../icon/icon.svelte';
  import { insertEditorComponent } from './insert-component.js';

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

  const { label, icon } = $derived(component);
</script>

<Button
  iconic={!!icon}
  label={icon ? undefined : label}
  title={label}
  aria-label={label}
  aria-controls={editorStore.controlId}
  onclick={() => {
    insertEditorComponent(editorStore, component);
  }}
>
  {#snippet startIcon()}
    {#if icon}
      <Icon name={icon} />
    {/if}
  {/snippet}
</Button>
