<!--
  @component
  A generic drawer widget based on the HTML `<dialog>` element.
  @see https://w3c.github.io/aria/#dialog
  @see https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
-->
<script>
  import { onDestroy, untrack } from 'svelte';
  import { getModalLabelAttrs } from '../../services/label.js';
  import { startPointerDrag } from '../../services/pointer-drag.js';
  import ModalCloseButton from '../dialog/modal-close-button.svelte';
  import ModalHeader from '../dialog/modal-header.svelte';
  import Modal from '../util/modal.svelte';
  import {
    addSwipeSample,
    getSwipeDirection,
    getSwipeOffset,
    getSwipeVelocity,
    shouldDismissSwipe,
  } from './drawer.js';

  /**
   * @import { Snippet } from 'svelte';
   * @import { ModalLabelProps, ModalProps } from '#lib/typedefs.js';
   * @import { SwipeState } from './drawer.js';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the content element.
   * @property {boolean} [open] Whether to open the drawer.
   * @property {'top' | 'right' | 'bottom' | 'left'} [position] Position of the drawer.
   * @property {'small' | 'medium' | 'large' | 'x-large' | 'full'} [size] Width or height of the
   * drawer.
   * @property {'inside' | 'outside' | false} [showClose] Whether to show the Close button.
   * @property {boolean} [swipeDismiss] Whether the drawer can be dismissed by dragging it towards
   * the edge it’s attached to, as a bottom sheet on a mobile device is. The drag starts from the
   * header, or from a grab handle shown on a top or bottom drawer; the main content and the footer
   * are left alone, so they can be scrolled and interacted with. The Close button and the Escape
   * key still work, as the gesture isn’t available to everyone.
   * @property {Snippet} [children] Primary slot content.
   * @property {Snippet} [header] Header slot content.
   * @property {Snippet} [headerExtra] Header extra slot content.
   * @property {Snippet} [footer] Footer slot content.
   * @property {Snippet} [closeIcon] Close icon slot content.
   * @property {Snippet} [extraContent] Extra content slot content.
   */

  /**
   * @type {ModalProps & ModalLabelProps & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    open = $bindable(false),
    class: className,
    title = '',
    ariaLabelledby = undefined,
    position = 'right',
    size = 'small',
    showClose = 'outside',
    swipeDismiss = false,
    children,
    header,
    headerExtra,
    footer,
    closeIcon,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * Elements a drag can’t start from: the parts of the drawer that can scroll or hold text to
   * select, and anything interactive.
   */
  const EXCLUDED_SWIPE_TARGETS = [
    '.main',
    '.footer',
    '.extra-control',
    'a',
    'button',
    'input',
    'select',
    'textarea',
    '[contenteditable]',
    '[tabindex]',
  ].join(', ');

  /**
   * The ID of the drawer.
   * @type {string}
   */
  const id = $props.id();

  /**
   * A reference to the modal component.
   * @type {Modal | undefined}
   */
  let modal = $state();

  const orientation = $derived(
    position === 'right' || position === 'left' ? 'vertical' : 'horizontal',
  );

  /**
   * A reference to the content element.
   * @type {HTMLElement | undefined}
   */
  let content = $state();
  /**
   * The drag in progress, if any. The object is replaced rather than updated, except for the
   * samples, which only feed the speed calculation on release, so nothing needs to track them.
   * @type {SwipeState | undefined}
   */
  let swipe = $state.raw();
  /**
   * Distance the drawer has been dragged towards its edge, in pixels.
   * @type {number}
   */
  let swipeOffset = $state(0);

  /**
   * Close the drawer with the Close button or the swipe gesture.
   */
  const close = () => {
    modal?.close('close');
  };

  /**
   * Function to stop following the pointer dragging the drawer, if any.
   * @type {(() => void) | undefined}
   */
  let stopSwipe;

  /**
   * Stop following the pointer, and put the drawer back where the drag has started.
   */
  const resetSwipe = () => {
    stopSwipe?.();
    stopSwipe = undefined;
    swipe = undefined;
    swipeOffset = 0;
  };

  /**
   * Move the drawer along with the pointer, and sample the drag to measure its speed on release.
   * @param {PointerEvent} event `pointermove` event.
   */
  const onSwipeMove = ({ clientX, clientY, timeStamp }) => {
    if (!swipe) {
      return;
    }

    swipeOffset = getSwipeOffset(
      (swipe.axis === 'Y' ? clientY : clientX) - swipe.start,
      swipe.sign,
    );
    swipe.samples = addSwipeSample(swipe.samples, { offset: swipeOffset, time: timeStamp });
  };

  /**
   * End the drag. The drawer is dismissed if it has been released after being dragged far enough
   * or flicked, or goes back into place otherwise, for example when the drag is cancelled. Either
   * way, the transition picks up from where the drag has left the drawer.
   * @param {PointerEvent} event Event that ends the drag.
   */
  const onSwipeEnd = (event) => {
    if (!swipe || !content) {
      resetSwipe();

      return;
    }

    const { width, height } = content.getBoundingClientRect();
    // The pointer may have been held still since it last moved, which ends any flick
    const samples = addSwipeSample(swipe.samples, { offset: swipeOffset, time: event.timeStamp });

    const dismiss =
      event.type === 'pointerup' &&
      shouldDismissSwipe({
        offset: swipeOffset,
        size: swipe.axis === 'Y' ? height : width,
        velocity: getSwipeVelocity(samples),
      });

    resetSwipe();

    if (dismiss) {
      close();
    }
  };

  /**
   * Handle the `pointerdown` event on the content, starting a drag from anywhere but the main
   * content, the footer and the controls.
   * @param {PointerEvent} event `pointerdown` event.
   */
  const onPointerDown = (event) => {
    const { button, isPrimary, target, clientX, clientY } = event;

    if (!swipeDismiss || !content || swipe || button !== 0 || !isPrimary) {
      return;
    }

    // The dialog around the content is focusable too, so only look inside the content
    const excluded = /** @type {Element} */ (target).closest(EXCLUDED_SWIPE_TARGETS);

    if (excluded && content.contains(excluded)) {
      return;
    }

    const { axis, sign } = getSwipeDirection(position, content.matches(':dir(rtl)'));

    swipe = { axis, sign, start: axis === 'Y' ? clientY : clientX, samples: [] };
    swipeOffset = 0;
    stopSwipe = startPointerDrag(content, event, { onMove: onSwipeMove, onEnd: onSwipeEnd });
  };

  $effect(() => {
    if (!open) {
      // The drawer can be closed in the middle of a drag, e.g. with the Escape key, and should
      // then slide away rather than stay where the drag has left it
      untrack(() => {
        resetSwipe();
      });
    }
  });

  onDestroy(resetSwipe);

  /**
   * Labelling attributes for the `<dialog>`, giving it an accessible name.
   */
  const labelAttrs = $derived(
    getModalLabelAttrs({ id, title, ariaLabelledby, hasCustomHeader: !!header }),
  );
</script>

<Modal bind:this={modal} {...restProps} bind:open {id} class="drawer" {...labelAttrs} showBackdrop>
  <div
    bind:this={content}
    role="none"
    class={[
      'content',
      className,
      size,
      position,
      orientation,
      { 'swipe-dismiss': swipeDismiss, swiping: !!swipe },
    ]}
    style:transform={swipe ? `translate${swipe.axis}(${swipe.sign * swipeOffset}px)` : undefined}
    style:transition-duration={swipe ? '0s' : undefined}
    onpointerdown={onPointerDown}
  >
    {#if swipeDismiss && position === 'bottom'}
      <div role="none" class="handle"></div>
    {/if}
    <div role="none" class="extra-control">
      {#if showClose === 'outside'}
        <ModalCloseButton class="close" controls={id} {closeIcon} onClose={close} />
      {/if}
    </div>
    {#if title || showClose === 'inside' || header || headerExtra}
      <ModalHeader
        variant="drawer"
        {id}
        {title}
        showClose={showClose === 'inside'}
        closeClass="close"
        onClose={close}
        {header}
        {headerExtra}
        {closeIcon}
      />
    {/if}
    <div role="none" class="main">
      {@render children?.()}
    </div>
    {#if footer}
      <div role="none" class="footer">
        {@render footer?.()}
      </div>
    {/if}
    {#if swipeDismiss && position === 'top'}
      <div role="none" class="handle"></div>
    {/if}
  </div>
</Modal>

<style lang="scss">
  @use 'sass:map';
  @use '../../styles/modal';

  // Default width of a side drawer, or height of a top or bottom drawer, for each `size` but `full`
  $sizes: (
    'small': 400px,
    'medium': 600px,
    'large': 800px,
    'x-large': 1000px,
  );

  // Default corner radii for each `position`, rounding the corners away from the edge the drawer is
  // attached to
  $corner-radii: (
    'right': (
      'start-start': 4px,
      'start-end': 0,
      'end-end': 0,
      'end-start': 4px,
    ),
    'left': (
      'start-start': 0,
      'start-end': 4px,
      'end-end': 4px,
      'end-start': 0,
    ),
    'top': (
      'start-start': 0,
      'start-end': 0,
      'end-end': 4px,
      'end-start': 4px,
    ),
    'bottom': (
      'start-start': 4px,
      'start-end': 4px,
      'end-end': 0,
      'end-start': 0,
    ),
  );

  // Round the corners of the drawer in the given position, each of which can be customized with a
  // CSS variable for the position or for any position, and all of which with a variable for the
  // `full` size
  @mixin border-radius($position) {
    @each $corner, $radius in map.get($corner-radii, $position) {
      border-#{$corner}-radius: var(
        --sui-drawer-#{$position}-content-border-#{$corner}-radius,
        var(--sui-drawer-content-border-#{$corner}-radius, #{$radius})
      );
    }

    &.full {
      border-radius: var(
        --sui-drawer-#{$position}-full-content-border-radius,
        var(--sui-drawer-#{$position}-content-border-radius, 0)
      );
    }
  }

  .content {
    @include modal.content-surface(drawer);

    position: absolute;
    max-width: 100dvw;
    max-height: 100dvh;

    .extra-control {
      position: absolute;

      :global {
        button.close {
          margin: 8px;
        }
      }
    }

    :global(dialog.open) & {
      transition-duration: 150ms;
      transform: translateX(0%);
    }

    :global(dialog:not(.open)) & {
      transition-duration: 300ms;
    }

    &.right {
      inset-block: var(--sui-drawer-right-content-inset-block, 0);
      inset-inline: var(--sui-drawer-right-content-inset-inline, auto 0);
      @include border-radius(right);

      .extra-control {
        inset-block-start: 0;
        inset-inline-end: 100%;
      }

      :global(dialog:not(.open)) & {
        &:dir(ltr) {
          transform: translateX(105%);
        }

        &:dir(rtl) {
          transform: translateX(-105%);
        }
      }
    }

    &.left {
      inset-block: var(--sui-drawer-left-content-inset-block, 0);
      inset-inline: var(--sui-drawer-left-content-inset-inline, 0 auto);
      @include border-radius(left);

      .extra-control {
        inset-block-start: 0;
        inset-inline-start: 100%;
      }

      :global(dialog:not(.open)) & {
        &:dir(ltr) {
          transform: translateX(-105%);
        }

        &:dir(rtl) {
          transform: translateX(105%);
        }
      }
    }

    &.vertical {
      :global(dialog.open) & {
        transform: translateX(0%);
      }

      @each $size, $length in $sizes {
        &.#{$size} {
          width: var(
            --sui-drawer-vertical-#{$size}-width,
            var(--sui-drawer-vertical-width, #{$length})
          );
          max-width: var(
            --sui-drawer-vertical-#{$size}-max-width,
            var(--sui-drawer-vertical-max-width, calc(100dvw - 56px))
          );
          height: var(
            --sui-drawer-vertical-#{$size}-height,
            var(--sui-drawer-vertical-height, 100dvh)
          );
        }
      }

      &.full {
        width: 100dvw;
        max-width: 100dvw;
        height: 100dvh;
      }
    }

    &.top {
      inset-block-start: var(--sui-drawer-top-content-inset-block, 0);
      inset-inline: var(--sui-drawer-top-content-inset-inline, 0 0);
      @include border-radius(top);

      .extra-control {
        inset-block-start: 100%;
        inset-inline-end: 0;
      }

      :global(dialog:not(.open)) & {
        transform: translateY(-105%);
      }
    }

    &.bottom {
      inset-block: var(--sui-drawer-bottom-content-inset-block, auto 0);
      inset-inline: var(--sui-drawer-bottom-content-inset-inline, 0);
      @include border-radius(bottom);

      .extra-control {
        inset-block-end: 100%;
        inset-inline-end: 0;
      }

      :global(dialog:not(.open)) & {
        transform: translateY(105%);
      }
    }

    &.horizontal {
      :global(dialog.open) & {
        transform: translateY(0%);
      }

      @each $size, $length in $sizes {
        &.#{$size} {
          width: var(
            --sui-drawer-horizontal-#{$size}-width,
            var(--sui-drawer-horizontal-width, 100dvw)
          );
          height: var(
            --sui-drawer-horizontal-#{$size}-height,
            var(--sui-drawer-horizontal-height, #{$length})
          );
          max-height: var(
            --sui-drawer-horizontal-#{$size}-max-height,
            var(--sui-drawer-horizontal-max-height, calc(100dvh - 56px))
          );
        }
      }

      &.full {
        width: 100dvw;
        height: 100dvh;
        max-height: 100dvh;
      }
    }
  }

  .content.swipe-dismiss {
    // A drag can start from these. The browser would otherwise take a touch drag over to pan the
    // page, cancelling the pointer. Something scrollable inside them, like a long tab list in a
    // custom header, can still be scrolled: the browser only looks up to the nearest scroll
    // container for the touch behavior allowed
    & > :global(:not(.main, .footer, .extra-control)) {
      touch-action: none;
      user-select: none;
    }

    &.swiping,
    &.swiping .handle {
      cursor: grabbing;
    }
  }

  .handle {
    flex: none;
    display: flex;
    justify-content: center;
    padding: 8px 0;
    cursor: grab;

    &::before {
      content: '';
      border-radius: 2px;
      width: 32px;
      height: 4px;
      background-color: var(--sui-drawer-handle-color, var(--sui-secondary-foreground-color));
      opacity: 0.5;
    }
  }

  .footer {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 24px 24px;
  }

  .main {
    flex: auto;
    overflow: auto;
    padding: var(--sui-drawer-main-padding, 24px);
    white-space: normal;
  }
</style>
