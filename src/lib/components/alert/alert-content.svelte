<!--
  @component
  The content shared by `<Alert>` and `<Infobar>`: the status icon, the status spelled out off
  screen, and the message. Internal; not exported.
-->
<script>
  import { _ } from '@sveltia/i18n';
  import Icon from '../icon/icon.svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { AlertStatus } from './alert.js';
   */

  /**
   * @typedef {object} Props
   * @property {AlertStatus} status Alert status.
   * @property {Snippet} [children] Primary slot content.
   * @property {Snippet} [icon] Icon slot content.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    status,
    children = undefined,
    icon = undefined,
    /* eslint-enable prefer-const */
  } = $props();
</script>

<!--
  The colour and icon tell sighted users how serious the message is; the icon is hidden from
  assistive technology, so the status is also spelled out for screen readers, off screen.
-->
{#if icon}
  {@render icon()}
{:else}
  <Icon name={status === 'success' ? 'check_circle' : status} />
{/if}
<span class="status-label">{_(`_sui.alert.${status}`)}</span>
{@render children?.()}

<style lang="scss">
  .status-label {
    position: absolute;
    overflow: hidden;
    clip-path: inset(50%);
    width: 1px;
    height: 1px;
    white-space: nowrap;
  }
</style>
