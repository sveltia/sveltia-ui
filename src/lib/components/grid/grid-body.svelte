<!--
  @component
  The interactive version of `<TableBody>`. A labelled row group can be made collapsible, in which
  case the caption doubles as an expander button that shows or hides the rows.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody
  @see https://w3c.github.io/aria/#rowgroup
  @see https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
-->
<script>
  import { _, isRTL } from '@sveltia/i18n';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { Attachment } from 'svelte/attachments';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {string} [label] Display label for the row group.
   * @property {boolean} [collapsible] Whether the rows can be hidden with an expander in the
   * caption. Requires `label`.
   * @property {boolean} [expanded] Whether the rows are shown. Only applies when `collapsible`. An
   * alias of the `aria-expanded` attribute on the expander button.
   * @property {Snippet} [children] Primary slot content.
   * @property {Snippet} [chevronIcon] Chevron slot content for the expander.
   * @property {(event: CustomEvent) => void} [onChange] Custom `Change` event handler, called with
   * the new `expanded` state in `detail` when the expander is toggled.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    expanded = $bindable(true),
    class: className,
    label = '',
    collapsible = false,
    children,
    chevronIcon,
    onChange,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const id = $props.id();
  const hasExpander = $derived(collapsible && !!label);

  /**
   * Toggle the `expanded` state and notify the consumer.
   */
  const toggle = () => {
    expanded = !expanded;
    onChange?.(new CustomEvent('change', { detail: { expanded } }));
  };

  /**
   * Toggle the expander when the caption row itself is clicked. The `Grid` treats the caption as a
   * row: the arrow keys land on it, and Enter clicks it, so this is how a keyboard user who has
   * moved to the caption toggles the group. A click bubbling up from the button is left alone, as
   * the button has toggled the group already.
   * @type {Attachment}
   */
  const handleCaptionClick = (element) => {
    /**
     * Handle the `click` event on the caption row.
     * @param {Event} event `click` event.
     */
    const listener = (event) => {
      if (hasExpander && event.target === element) {
        toggle();
      }
    };

    element.addEventListener('click', listener);

    return () => {
      element.removeEventListener('click', listener);
    };
  };
</script>

<div
  {...restProps}
  role="rowgroup"
  class="sui grid-body row-group {className}"
  aria-labelledby={label ? `${id}-label` : undefined}
  aria-roledescription={_('_sui.role_descriptions.grid_body')}
>
  {#if label}
    <div role="row" class="row-group-caption" {@attach handleCaptionClick}>
      <!-- We need `colspan` here but cannot place `<th>` under `<div>`, so use a hack -->
      <svelte:element this={"th"} role="columnheader" id="{id}-label" colspan="9999">
        {#if hasExpander}
          <!--
            The button is not a tab stop: the grid has a single one, and a keyboard user reaches
            the caption row with the arrow keys and toggles it with Enter
          -->
          <Button class="expander" {label} tabindex="-1" aria-expanded={expanded} onclick={toggle}>
            {#snippet startIcon()}
              <span role="none" class="chevron">
                {#if chevronIcon}
                  {@render chevronIcon()}
                {:else}
                  <Icon name={isRTL() ? 'chevron_left' : 'chevron_right'} />
                {/if}
              </span>
            {/snippet}
          </Button>
        {:else}
          {label}
        {/if}
      </svelte:element>
    </div>
  {/if}
  {#if !hasExpander || expanded}
    {@render children?.()}
  {/if}
</div>

<style lang="scss">
  [role='rowgroup'] {
    display: table-row-group;
  }

  [role='row'] {
    display: table-row;
  }

  [role='columnheader'] {
    display: table-cell;
    padding: 8px;
    color: var(--sui-secondary-foreground-color);
    background-color: var(--sui-secondary-background-color);
    font-size: var(--sui-font-size-default);
    text-align: start;

    // The expander takes the place of the caption text, so it fills the cell and keeps its look
    &:has(> :global(.expander)) {
      padding: 0;
    }

    :global(.expander) {
      justify-content: flex-start;
      margin: 0;
      border-radius: 0;
      padding: 4px 8px 4px 4px;
      width: 100%;
      height: auto;
      color: inherit;
      font-size: inherit;
      text-align: start;
    }
  }

  .chevron {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 200ms;

    :global(.expander[aria-expanded='true']) > & {
      &:dir(ltr) {
        transform: rotate(90deg);
      }

      &:dir(rtl) {
        transform: rotate(-90deg);
      }
    }
  }
</style>
