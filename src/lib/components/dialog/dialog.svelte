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
  import Button from '../button/button.svelte';
  import Spacer from '../divider/spacer.svelte';
  import Modal from '../util/modal.svelte';
  import ModalCloseButton from './modal-close-button.svelte';

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
   * Accessible name for the `<dialog>`. The built-in header renders the title in an element the
   * dialog can point at; with a custom header the title is only text, so it becomes `aria-label`
   * unless the consumer names the labelling element.
   */
  const labelledby = $derived(ariaLabelledby ?? (!header && title ? `${id}-title` : undefined));
  const label = $derived(labelledby ? undefined : title || undefined);
  /**
   * A reference to the modal component.
   * @type {Modal | undefined}
   */
  let modalComponent = $state();
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
   * @type {{ pointerId: number, x: number, y: number, offset: { x: number, y: number }, rect:
   * DOMRect } | undefined}
   */
  let dragStart;

  /**
   * Move the dialog back to the center of the viewport, ending a drag if any.
   */
  const recenter = () => {
    offset = { x: 0, y: 0 };
    dragStart = undefined;
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
   * Start moving the dialog when the header is pressed, unless a button or another control in the
   * header is. Only bound when the dialog is {@link movable}.
   * @param {PointerEvent} event `pointerdown` event.
   */
  const onHeaderPointerDown = (event) => {
    const { button, pointerId, clientX, clientY, currentTarget, target } = event;
    const headerElement = /** @type {HTMLElement} */ (currentTarget);

    // Look for the control within the header only: the `<dialog>` around it has `tabindex` as well
    const control = /** @type {HTMLElement} */ (target).closest(
      'button, input, select, textarea, a, [tabindex]',
    );

    if (button !== 0 || (control && headerElement.contains(control))) {
      return;
    }

    event.preventDefault();
    headerElement.setPointerCapture(pointerId);
    dragStart = {
      pointerId,
      x: clientX,
      y: clientY,
      offset: { ...offset },
      // The header is rendered within the content
      rect: /** @type {HTMLElement} */ (content).getBoundingClientRect(),
    };
  };

  /**
   * Move the dialog along with the pointer, keeping it within the viewport.
   * @param {PointerEvent} event `pointermove` event.
   */
  const onHeaderPointerMove = ({ pointerId, buttons, clientX, clientY }) => {
    if (!dragStart || dragStart.pointerId !== pointerId) {
      return;
    }

    // The drag can end without a `pointerup` reaching the header, e.g. when the dialog is closed
    // halfway, so a move without the primary button pressed ends it. The primary button is the
    // lowest bit of `buttons`
    if (buttons % 2 === 0) {
      dragStart = undefined;

      return;
    }

    const { x, y, offset: startOffset, rect } = dragStart;

    offset = {
      x: startOffset.x + clamp(clientX - x, rect.left, window.innerWidth - rect.right),
      y: startOffset.y + clamp(clientY - y, rect.top, window.innerHeight - rect.bottom),
    };
  };

  /**
   * Stop moving the dialog.
   * @param {PointerEvent} event `pointerup` or `pointercancel` event.
   */
  const onHeaderPointerUp = ({ pointerId }) => {
    if (dragStart?.pointerId === pointerId) {
      dragStart = undefined;
    }
  };

  /**
   * Event handlers that let the user move the dialog by dragging its header.
   */
  const dragHandlers = {
    onpointerdown: onHeaderPointerDown,
    onpointermove: onHeaderPointerMove,
    onpointerup: onHeaderPointerUp,
    onpointercancel: onHeaderPointerUp,
  };

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

        const target = focusInput
          ? /** @type {HTMLInputElement | HTMLButtonElement | null} */ (
              content?.querySelector('input, button.primary')
            )
          : null;

        if (target) {
          target.focus();

          if (target instanceof HTMLInputElement) {
            target.select();
          }
        } else {
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
  aria-label={label}
  aria-labelledby={labelledby}
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
      <div role="none" class="header" class:movable {...movable ? dragHandlers : {}}>
        {#if header}
          {@render header()}
        {:else}
          <div role="none" id="{id}-title" class="title">
            {title}
          </div>
          <Spacer flex={true} />
          {@render headerExtra?.()}
          {#if showClose}
            <ModalCloseButton
              controls={id}
              {closeIcon}
              onClose={() => {
                modalComponent?.close('close');
              }}
            />
          {/if}
        {/if}
      </div>
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
              disabled={okDisabled}
              onclick={() => {
                modalComponent?.close('ok');
              }}
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
  .content {
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    // No border by default; the high-contrast theme draws one, as the OS does around its windows
    border-width: var(--sui-dialog-content-border-width, var(--sui-modal-border-width, 0));
    border-style: solid;
    border-color: var(--sui-dialog-content-border-color, var(--sui-primary-border-color));
    border-radius: var(--sui-dialog-content-border-radius, 4px);
    max-width: calc(100dvw - var(--sui-dialog-content-margin, 16px) * 2);
    background-color: var(
      --sui-dialog-content-background-color,
      var(--sui-secondary-background-color-translucent)
    );
    box-shadow: var(--sui-dialog-content-box-shadow, 0 8px 16px var(--sui-popup-shadow-color));
    -webkit-backdrop-filter: var(--sui-dialog-content-backdrop-filter, blur(16px));
    backdrop-filter: var(--sui-dialog-content-backdrop-filter, blur(16px));
    transition-property: transform;

    :global(dialog.open) & {
      transition-duration: 150ms;
      transform: scale(100%);
    }

    :global(dialog:not(.open)) & {
      transition-duration: 300ms;
      transform: scale(90%);
    }

    &.x-small {
      width: var(--sui-dialog-x-small-content-width, var(--sui-dialog-content-width, 300px));
      max-height: var(
        --sui-dialog-x-small-content-max-height,
        var(--sui-dialog-content-max-height, 300px)
      );

      // The default minimum width of a textbox would overflow a dialog this narrow
      --sui-textbox-singleline-min-width: 0;

      @media (max-height: 300px) {
        max-height: calc(100dvh - 32px);
      }
    }

    &.small {
      width: var(--sui-dialog-small-content-width, var(--sui-dialog-content-width, 400px));
      max-height: var(
        --sui-dialog-small-content-max-height,
        var(--sui-dialog-content-max-height, 400px)
      );

      @media (max-height: 400px) {
        max-height: calc(100dvh - 32px);
      }
    }

    &.medium {
      width: var(--sui-dialog-medium-content-width, var(--sui-dialog-content-width, 600px));
      max-height: var(
        --sui-dialog-medium-content-max-height,
        var(--sui-dialog-content-max-height, 600px)
      );

      @media (max-height: 600px) {
        max-height: calc(100dvh - 32px);
      }
    }

    &.large {
      width: var(--sui-dialog-large-content-width, var(--sui-dialog-content-width, 800px));
      max-height: var(
        --sui-dialog-large-content-max-height,
        var(--sui-dialog-content-max-height, 800px)
      );

      @media (max-height: 800px) {
        max-height: calc(100dvh - 32px);
      }
    }

    &.x-large {
      width: var(--sui-dialog-x-large-content-width, var(--sui-dialog-content-width, 1000px));
      max-height: var(
        --sui-dialog-x-large-content-max-height,
        var(--sui-dialog-content-max-height, 1000px)
      );

      @media (max-height: 1000px) {
        max-height: calc(100dvh - 32px);
      }
    }
  }

  :is(.header, .footer) {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .header {
    box-sizing: content-box;
    margin: var(--sui-dialog-header-margin, 0 16px);
    border-width: var(--sui-dialog-header-border-width, 0 0 1px);
    border-color: var(--sui-dialog-header-border-color, var(--sui-secondary-border-color));
    padding: var(--sui-dialog-header-padding, 16px 8px);
    height: var(--sui-dialog-header-height, 32px);

    &.movable {
      cursor: move;
    }

    .title {
      font-size: var(--sui-font-size-large);
      font-weight: var(--sui-font-weight-bold);
    }
  }

  .footer {
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
