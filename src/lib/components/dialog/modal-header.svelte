<!--
  @component
  The header shared by `<Dialog>` and `<Drawer>`, showing the title, any extra content and the Close
  button, or a custom header instead. Internal; not exported.
-->
<script>
  import Spacer from '../divider/spacer.svelte';
  import ModalCloseButton from './modal-close-button.svelte';

  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {'dialog' | 'drawer'} variant Component the header belongs to, which names the CSS
   * variables the header can be customized with, and sets the gap between its items.
   * @property {string} id ID of the dialog or drawer. The title gets the ID with a `-title` suffix.
   * @property {string} [title] Title text.
   * @property {boolean} [movable] Whether the dialog can be moved by dragging the header, which
   * changes the cursor.
   * @property {boolean} [showClose] Whether to show the Close button.
   * @property {string} [closeClass] The `class` attribute on the Close button.
   * @property {() => void} [onClose] Callback invoked when the Close button is clicked.
   * @property {boolean} [wrapCustomHeader] Whether to render a custom {@link header} within the
   * header element, rather than on its own.
   * @property {Snippet} [header] Custom header, used instead of the title, the extra content and
   * the Close button.
   * @property {Snippet} [headerExtra] Extra content shown after the title.
   * @property {Snippet} [closeIcon] Custom icon of the Close button.
   */

  /** @type {Props & Record<string, any>} */
  let {
    /* eslint-disable prefer-const */
    variant,
    id,
    title = '',
    movable = false,
    showClose = false,
    closeClass = undefined,
    onClose = () => {},
    wrapCustomHeader = false,
    header = undefined,
    headerExtra = undefined,
    closeIcon = undefined,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

{#if header && !wrapCustomHeader}
  {@render header()}
{:else}
  <div role="none" {...restProps} class={['header', variant, { movable }]}>
    {#if header}
      {@render header()}
    {:else}
      <div role="none" id="{id}-title" class="title">
        {title}
      </div>
      <Spacer flex={true} />
      {@render headerExtra?.()}
      {#if showClose}
        <ModalCloseButton class={closeClass} controls={id} {closeIcon} {onClose} />
      {/if}
    {/if}
  </div>
{/if}

<style lang="scss">
  // Gap between the items in the header for each `variant`
  $gaps: (
    'dialog': 4px,
    'drawer': 8px,
  );

  .header {
    display: flex;
    align-items: center;
    box-sizing: content-box;

    // `:where()` keeps the specificity the header has always had, so it can still be overridden
    @each $variant, $gap in $gaps {
      &:where(.#{$variant}) {
        gap: $gap;
        margin: var(--sui-#{$variant}-header-margin, 0 16px);
        border-width: var(--sui-#{$variant}-header-border-width, 0 0 1px);
        border-color: var(--sui-#{$variant}-header-border-color, var(--sui-secondary-border-color));
        padding: var(--sui-#{$variant}-header-padding, 16px 8px);
        height: var(--sui-#{$variant}-header-height, 32px);

        @if $variant == 'drawer' {
          flex-direction: var(--sui-drawer-header-flex-direction, row);
        }
      }
    }

    &.movable {
      cursor: move;
    }

    .title {
      font-size: var(--sui-font-size-large);
      font-weight: var(--sui-font-weight-bold);
    }
  }
</style>
