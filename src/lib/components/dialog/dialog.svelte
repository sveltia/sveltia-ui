<!--
  @component
  A feedback dialog widget based on the HTML `<dialog>` element.
  @see https://w3c.github.io/aria/#dialog
  @see https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
-->
<script module>
  /**
   * Keep the distance a dialog is dragged within the room it has on either side.
   * @param {number} distance Distance moved.
   * @param {number} before Room on the left or top.
   * @param {number} after Room on the right or bottom.
   * @returns {number} Clamped distance.
   */
  const clamp = (distance, before, after) =>
    Math.min(Math.max(distance, -before), Math.max(after, 0));
</script>

<script>
  import { _ } from '@sveltia/i18n';
  import { sleep } from '@sveltia/utils/misc';
  import { onDestroy } from 'svelte';
  import { getModalLabelAttrs } from '../../services/label.js';
  import { startPointerDrag } from '../../services/pointer-drag.js';
  import Button from '../button/button.svelte';
  import Spacer from '../divider/spacer.svelte';
  import Modal from '../util/modal.svelte';
  import ModalHeader from './modal-header.svelte';

  /**
   * @import { DialogProps, ModalProps } from '#lib/typedefs.js';
   */

  /**
   * @type {ModalProps & DialogProps & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    open = $bindable(false),
    value = $bindable(''),
    title,
    ariaLabelledby = undefined,
    role = 'dialog',
    size = 'medium',
    modal = true,
    showBackdrop = undefined,
    movable = false,
    class: className,
    showClose = false,
    showOk = true,
    showCancel = true,
    okLabel = '',
    okShortcuts = undefined,
    okDisabled = false,
    cancelLabel = '',
    cancelShortcuts = undefined,
    cancelDisabled = false,
    focusInput = true,
    onBeforeOk = undefined,
    children,
    header,
    headerExtra,
    footer,
    footerExtra,
    closeIcon,
    input: _input,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * The ID of the dialog.
   * @type {string}
   */
  const id = $props.id();

  /**
   * Labelling attributes for the `<dialog>`, giving it an accessible name.
   */
  const labelAttrs = $derived(
    getModalLabelAttrs({ id, title, ariaLabelledby, hasCustomHeader: !!header }),
  );
  /**
   * A reference to the modal component.
   * @type {Modal | undefined}
   */
  let modalComponent = $state();
  /**
   * Whether {@link onBeforeOk} is running, during which the OK button is disabled.
   */
  let okBusy = $state(false);

  /**
   * Close the dialog with the OK button, unless {@link onBeforeOk} says to keep it open because the
   * request it sends has failed, so the user can correct what they entered.
   */
  const confirm = async () => {
    if (onBeforeOk) {
      okBusy = true;

      try {
        if ((await onBeforeOk()) === false) {
          return;
        }
      } catch {
        return;
      } finally {
        okBusy = false;
      }
    }

    modalComponent?.close('ok');
  };
  /**
   * @type {HTMLElement | undefined}
   */
  let content = $state();

  /**
   * How far the user has moved the dialog from the center of the viewport by dragging its header.
   * @type {{ x: number, y: number }}
   */
  let offset = $state({ x: 0, y: 0 });
  /**
   * Where the current drag started, if the user is dragging the header.
   * @type {{ x: number, y: number, offset: { x: number, y: number }, rect: DOMRect } | undefined}
   */
  let dragStart;
  /**
   * Function to stop following the pointer dragging the header, if any.
   * @type {(() => void) | undefined}
   */
  let stopDrag;

  /**
   * End the current drag, if any.
   */
  const endDrag = () => {
    stopDrag?.();
    stopDrag = undefined;
    dragStart = undefined;
  };

  /**
   * Move the dialog back to the center of the viewport, ending a drag if any.
   */
  const recenter = () => {
    offset = { x: 0, y: 0 };
    endDrag();
  };

  $effect(() => {
    if (!open) {
      return undefined;
    }

    // Start from the center whenever the dialog is opened again
    recenter();

    if (!movable) {
      return undefined;
    }

    // A moved dialog could end up outside a smaller viewport, so bring it back to the center
    window.addEventListener('resize', recenter);

    return () => {
      window.removeEventListener('resize', recenter);
    };
  });

  /**
   * Move the dialog along with the pointer, keeping it within the viewport.
   * @param {PointerEvent} event `pointermove` event.
   */
  const onDragMove = ({ clientX, clientY }) => {
    if (!dragStart) {
      return;
    }

    const { x, y, offset: startOffset, rect } = dragStart;

    offset = {
      x: startOffset.x + clamp(clientX - x, rect.left, window.innerWidth - rect.right),
      y: startOffset.y + clamp(clientY - y, rect.top, window.innerHeight - rect.bottom),
    };
  };

  /**
   * Start moving the dialog when the header is pressed, unless a button or another control in the
   * header is. Only bound when the dialog is {@link movable}.
   * @param {PointerEvent} event `pointerdown` event.
   */
  const onHeaderPointerDown = (event) => {
    const { button, clientX, clientY, currentTarget, target } = event;
    const headerElement = /** @type {HTMLElement} */ (currentTarget);

    // Look for the control within the header only: the `<dialog>` around it has `tabindex` as well
    const control = /** @type {HTMLElement} */ (target).closest(
      'button, input, select, textarea, a, [tabindex]',
    );

    if (button !== 0 || (control && headerElement.contains(control))) {
      return;
    }

    event.preventDefault();
    // A pointer pressed while another one is dragging takes over
    endDrag();
    dragStart = {
      x: clientX,
      y: clientY,
      offset: { ...offset },
      // The header is rendered within the content
      rect: /** @type {HTMLElement} */ (content).getBoundingClientRect(),
    };
    stopDrag = startPointerDrag(headerElement, event, { onMove: onDragMove, onEnd: endDrag });
  };

  onDestroy(endDrag);

  $effect(() => {
    if (open && content) {
      let cancelled = false;

      (async () => {
        await sleep(50);

        // Leave the focus alone if it has already moved into the content in the meantime, e.g. the
        // user has clicked an input field or started typing in it, or the content has taken the
        // focus on its own. Moving it now would pull it away, and selecting the input value would
        // cause the next keystrokes to replace it.
        if (cancelled || content?.contains(document.activeElement)) {
          return;
        }

        // A read-only or disabled field can’t be edited, so the first one that can is focused,
        // e.g. the name rather than a username that can’t be changed. A field that can’t take the
        // focus, like a hidden one, is skipped too: the first candidate the focus lands on wins
        const candidates = focusInput
          ? /** @type {(HTMLInputElement | HTMLButtonElement)[]} */ ([
              ...(content?.querySelectorAll(
                'input:not([type="hidden"], [readonly], :disabled), button.primary',
              ) ?? []),
            ])
          : [];

        const target = candidates.find((candidate) => {
          candidate.focus();

          return document.activeElement === candidate;
        });

        if (target instanceof HTMLInputElement) {
          target.select();
        }

        if (!target) {
          // Fall back to the `<dialog>` element itself, so the focus is never left outside the
          // modal, e.g. when the dialog has no input field or primary button
          modalComponent?.focus();
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    return undefined;
  });
</script>

<Modal
  bind:this={modalComponent}
  {...restProps}
  {role}
  {id}
  class="dialog"
  {...labelAttrs}
  aria-describedby="{id}-body"
  bind:open
  {modal}
  showBackdrop={showBackdrop ?? modal}
>
  <div
    bind:this={content}
    role="none"
    class={['content', className, size]}
    style:translate={movable ? `${offset.x}px ${offset.y}px` : undefined}
  >
    {#if title || showClose || header || headerExtra}
      <ModalHeader
        variant="dialog"
        {id}
        {title}
        {movable}
        {showClose}
        onClose={() => {
          modalComponent?.close('close');
        }}
        wrapCustomHeader={true}
        {header}
        {headerExtra}
        {closeIcon}
        onpointerdown={movable ? onHeaderPointerDown : undefined}
      />
    {/if}
    <div role="none" id="{id}-body" class="body">
      {@render children?.()}
    </div>
    {#if showOk || showCancel || footer || footerExtra}
      <div role="none" class="footer">
        {#if footer}
          {@render footer?.()}
        {:else}
          {@render footerExtra?.()}
          <Spacer flex={true} />
          {#if showOk}
            <Button
              variant="primary"
              label={okLabel || _('_sui.ok')}
              keyShortcuts={okShortcuts}
              disabled={okDisabled || okBusy}
              onclick={confirm}
            />
          {/if}
          {#if showCancel}
            <Button
              variant="secondary"
              label={cancelLabel || _('_sui.cancel')}
              keyShortcuts={cancelShortcuts}
              disabled={cancelDisabled}
              onclick={() => {
                modalComponent?.close('cancel');
              }}
            />
          {/if}
        {/if}
      </div>
    {/if}
  </div>
</Modal>

<style lang="scss">
  @use '../../styles/modal';

  // Default width and maximum height of the content for each `size`
  $sizes: (
    'x-small': 300px,
    'small': 400px,
    'medium': 600px,
    'large': 800px,
    'x-large': 1000px,
  );

  .content {
    @include modal.content-surface(dialog, $customizable: true);

    position: relative;
    overflow: hidden;
    border-radius: var(--sui-dialog-content-border-radius, 4px);
    max-width: calc(100dvw - var(--sui-dialog-content-margin, 16px) * 2);

    :global(dialog.open) & {
      transition-duration: 150ms;
      transform: scale(100%);
    }

    :global(dialog:not(.open)) & {
      transition-duration: 300ms;
      transform: scale(90%);
    }

    @each $size, $length in $sizes {
      &.#{$size} {
        width: var(
          --sui-dialog-#{$size}-content-width,
          var(--sui-dialog-content-width, #{$length})
        );
        max-height: var(
          --sui-dialog-#{$size}-content-max-height,
          var(--sui-dialog-content-max-height, #{$length})
        );

        @if $size == 'x-small' {
          // The default minimum width of a textbox would overflow a dialog this narrow
          --sui-textbox-singleline-min-width: 0;
        }

        @media (max-height: $length) {
          max-height: calc(100dvh - 32px);
        }
      }
    }
  }

  .footer {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: var(--sui-dialog-footer-margin, 0 24px 24px);

    @media (width < 768px) {
      margin: var(--sui-dialog-footer-margin, 0 16px 16px);
    }
  }

  .body {
    overflow: auto;
    // Padding rather than margin: glyphs drawn taller than the compact line height, as Source Sans
    // 3 does, overflow the content box, which Chrome turns into a scrollbar unless the padding
    // takes the excess. `--sui-dialog-body-margin` is still honoured for backward compatibility
    padding: var(--sui-dialog-body-padding, var(--sui-dialog-body-margin, 24px 24px));
    white-space: normal;
    line-height: var(--sui-line-height-compact);

    @media (width < 768px) {
      padding: var(--sui-dialog-body-padding, var(--sui-dialog-body-margin, 16px 16px));
    }
  }
</style>
