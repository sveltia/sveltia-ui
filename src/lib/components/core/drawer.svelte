<!--
  @component
  @see https://w3c.github.io/aria/#dialog
  @see https://w3c.github.io/aria-practices/#dialog_modal
-->
<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import Button from './button.svelte';
  import Icon from './icon.svelte';
  import Spacer from './spacer.svelte';

  /**
   * CSS class name on the button.
   * @type {String}
   */
  let className = '';

  export { className as class };

  /**
   * Whether to open the drawer.
   */
  export let open = false;

  /**
   * Title text displayed on the header.
   */
  export let title = '';

  /**
   * Position of the drawer.
   * @type {('top'|'right'|'bottom'|'left')}
   */
  export let position = 'right';

  /**
   * Width or height of the drawer.
   * @type {('small'|'medium'|'large'|'x-large')}
   */
  export let size = 'small';

  /**
   * Whether to show the Close button.
   * @type {('inside'|'outside'|false)}
   */
  export let showClose = 'outside';

  /**
   * Whether to close the drawer when the backdrop (outside of the drawer) is clicked.
   */
  export let closeOnBackdropClick = false;

  const dispatch = createEventDispatcher();
  /** @type {?HTMLDialogElement} */
  let dialog;
  /** @type {?HTMLFormElement} */
  let form;
  let showDialog = false;
  let showContent = false;

  $: orientation = position === 'right' || position === 'left' ? 'vertical' : 'horizontal';

  const openDialog = async () => {
    (document.querySelector('.sui.app-shell') || document.body).appendChild(dialog);
    showContent = true;
    dialog.showModal();

    window.requestAnimationFrame(() => {
      showDialog = true;
    });
  };

  const closeDialog = async () => {
    showDialog = false;

    if (dialog.returnValue === 'ok') {
      dispatch('ok');
    }

    if (dialog.returnValue === 'cancel') {
      dispatch('cancel');
    }

    dispatch('close', dialog.returnValue);

    await new Promise((resolve) => {
      form.addEventListener('transitionend', () => resolve(), { once: true });
    });

    showContent = false;
    dialog?.close();
    dialog?.remove();
  };

  const toggleDialog = () => {
    if (dialog) {
      if (open) {
        openDialog();
      } else {
        closeDialog();
      }
    }
  };

  // Call the function only when the `open` prop is changed
  $: toggleDialog(open);

  onMount(() => {
    dialog.remove();

    // onUnmount
    return () => {
      dialog?.close();
      dialog?.remove();
    };
  });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<dialog
  bind:this={dialog}
  class="sui dialog {className} {size} {position} {orientation}"
  class:open={showDialog}
  on:click={({ target }) => {
    if (closeOnBackdropClick && target?.matches('dialog')) {
      dialog.returnValue = 'cancel';
      open = false;
    }
  }}
  on:cancel|preventDefault={() => {
    // Cancelled with the Escape key
    open = false;
  }}
>
  <form method="dialog" bind:this={form} on:submit|preventDefault>
    <div class="extra-control">
      {#if showClose === 'outside'}
        <Button
          class="iconic close"
          on:click={() => {
            dialog.returnValue = 'close';
            open = false;
          }}
        >
          <Icon slot="start-icon" name="close" label={$_('sui._.close')} />
        </Button>
      {/if}
    </div>
    {#if showContent}
      {#if title || showClose === 'inside' || $$slots.header || $$slots['header-extra']}
        <div class="header">
          {#if $$slots.header}
            <slot name="header" />
          {:else}
            <div class="title">
              {title}
            </div>
            <Spacer flex={true} />
            {#if $$slots['header-extra']}
              <slot name="header-extra" />
            {/if}
            {#if showClose === 'inside'}
              <Button
                class="tertiary iconic close"
                on:click={() => {
                  dialog.returnValue = 'close';
                  open = false;
                }}
              >
                <Icon slot="start-icon" name="close" label={$_('sui._.close')} />
              </Button>
            {/if}
          {/if}
        </div>
      {/if}
      <div class="main">
        <slot />
      </div>
      {#if $$slots.footer}
        <div class="footer">
          <slot name="footer" />
        </div>
      {/if}
    {/if}
  </form>
</dialog>

<style lang="scss">
  dialog {
    overflow: hidden;
    outline: 0;
    background-color: var(--popup-backdrop-color);

    &.open {
      form {
        opacity: 1;
        transform: translateX(0%);
        transition-duration: 100ms;
      }
    }

    &:not(.open) {
      pointer-events: none !important;

      form {
        opacity: 0;
        transform: translateX(105%);
        pointer-events: none;
        transition-duration: 200ms;
      }

      :global(*) {
        pointer-events: none !important;
      }
    }

    :global(a),
    :global(input),
    :global(textarea),
    :global(button),
    :global([tabindex='0']) {
      pointer-events: all;
    }

    form {
      position: absolute;
      display: flex;
      flex-direction: column;
      border-radius: 4px;
      background-color: var(--secondary-background-color-translucent);
      backdrop-filter: blur(16px);
      box-shadow: 0 8px 16px var(--popup-shadow-color);
      will-change: opacity, transform;
      transition-property: opacity, transform;

      .extra-control {
        position: absolute;

        :global(button.close) {
          margin: 8px;
        }
      }
    }

    &.right {
      form {
        inset: 0 0 0 auto;

        .extra-control {
          inset: 0 100% auto auto;
        }
      }

      &:not(.open) form {
        transform: translateX(105%);
      }
    }

    &.left {
      form {
        inset: 0 auto 0 0;

        .extra-control {
          inset: 0 auto auto 100%;
        }
      }

      &:not(.open) form {
        transform: translateX(-105%);
      }
    }

    &.vertical {
      height: 100%;
      max-width: 100vw;

      &.open form {
        transform: translateX(0%);
      }

      &.small form {
        width: 400px;
      }

      &.medium form {
        width: 600px;
      }

      &.large form {
        width: 800px;
      }

      &.x-large form {
        width: 1000px;
      }
    }

    &.top {
      form {
        inset: 0 0 auto 0;

        .extra-control {
          inset: 100% 0 auto auto;
        }
      }

      &:not(.open) form {
        transform: translateY(-105%);
      }
    }

    &.bottom {
      form {
        inset: auto 0 0 0;

        .extra-control {
          inset: auto 0 100% auto;
        }
      }

      &:not(.open) form {
        transform: translateY(105%);
      }
    }

    &.horizontal {
      width: 100%;
      max-height: 100vh;

      &.open form {
        transform: translateY(0%);
      }

      &.small form {
        height: 400px;
      }

      &.medium form {
        height: 600px;
      }

      &.large form {
        height: 800px;
      }

      &.x-large form {
        height: 1000px;
      }
    }
  }

  .header,
  .footer {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header {
    box-sizing: content-box;
    margin: 0 16px;
    border-width: 0 0 1px;
    border-color: var(--secondary-border-color);
    padding: 16px 8px;
    height: 32px;

    .title {
      font-size: var(--font-size--large);
    }
  }

  .footer {
    margin: 0 24px 24px;
  }

  .main {
    flex: auto;
    overflow: auto;
    margin: 24px 24px;
    white-space: normal;
  }
</style>
