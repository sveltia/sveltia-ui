<!--
  @component
  The Close button shared by `<Dialog>` and `<Drawer>`. Internal; not exported.
-->
<script>
  import { _ } from '@sveltia/i18n';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';

  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the button.
   * @property {string} controls ID of the dialog or drawer the button closes.
   * @property {Snippet} [closeIcon] Custom icon, used instead of the default one.
   * @property {() => void} onClose Callback invoked when the button is clicked.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    class: className = undefined,
    controls,
    closeIcon = undefined,
    onClose,
    /* eslint-enable prefer-const */
  } = $props();
</script>

<Button
  variant="ghost"
  iconic
  class={className}
  aria-label={_('_sui.close')}
  aria-controls={controls}
  onclick={() => {
    onClose();
  }}
>
  {#snippet startIcon()}
    {#if closeIcon}
      {@render closeIcon()}
    {:else}
      <Icon name="close" />
    {/if}
  {/snippet}
</Button>
