<!--
  @component
  An icon button that copies the given text to the clipboard. Its tooltip shows its label. Once the
  text is copied, the button shows a check mark and the tooltip says “Copied” for a moment, which
  screen readers announce too.
-->
<script>
  import { _ } from '@sveltia/i18n';
  import { tick } from 'svelte';
  import { getAccessibleName } from '../../services/label.js';
  import Icon from '../icon/icon.svelte';
  import Tooltip from '../util/tooltip.svelte';
  import Button from './button.svelte';

  /**
   * @import { ButtonProps, CommonEventHandlers } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {string} text Text to copy.
   * @property {string} [ariaLabel] Accessible label, also shown in the tooltip, such as “Copy the
   * URL”. Default: “Copy”.
   * @property {(event: CustomEvent<{ text: string }>) => void} [onCopy] Called once the text has
   * been copied.
   * @property {(event: CustomEvent<{ error: unknown }>) => void} [onError] Called when the
   * clipboard refuses the text, such as when the browser denies the permission. The button then
   * stays as it was.
   */

  /**
   * @type {Omit<ButtonProps, 'label' | 'iconic' | 'value' | 'tooltip'> & CommonEventHandlers &
   * Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    text,
    ariaLabel = undefined,
    variant = 'ghost',
    tooltipPosition = 'auto',
    disabled = false,
    onCopy,
    onError,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * How long the button shows “Copied”, in milliseconds.
   */
  const COPIED_DURATION = 2000;

  let copied = $state(false);
  /** @type {HTMLButtonElement | undefined} */
  let buttonElement = $state();

  const label = $derived(
    getAccessibleName({ ariaLabel, props: restProps }) ?? _('_sui.copy_button.copy'),
  );
  let timer = 0;

  $effect(() => () => {
    clearTimeout(timer);
  });

  /**
   * Copy the text, and show that it’s been copied for a moment.
   */
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      onError?.(new CustomEvent('Error', { detail: { error } }));

      return;
    }

    // Reset first, so a second copy is announced as well
    copied = false;
    await tick();
    copied = true;
    clearTimeout(timer);
    timer = /** @type {number} */ (
      /** @type {unknown} */ (
        setTimeout(() => {
          copied = false;
        }, COPIED_DURATION)
      )
    );
    onCopy?.(new CustomEvent('Copy', { detail: { text } }));
  };
</script>

<Button
  {...restProps}
  bind:element={buttonElement}
  {variant}
  {disabled}
  iconic
  aria-label={label}
  onclick={copy}
>
  {#snippet startIcon()}
    <Icon name={copied ? 'check' : 'content_copy'} />
  {/snippet}
</Button>
<Tooltip
  anchor={buttonElement}
  text={copied ? _('_sui.copy_button.copied') : label}
  position={tooltipPosition}
  open={copied}
/>
<!-- A tooltip isn’t announced when it appears, so the outcome is announced separately -->
<span role="status" class="sui copy-button-status">
  {copied ? _('_sui.copy_button.copied') : ''}
</span>

<style lang="scss">
  @use '../../styles/mixins';

  .copy-button-status {
    @include mixins.visually-hidden;
  }
</style>
