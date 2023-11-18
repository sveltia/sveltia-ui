<!--
  @component
  A Markdown text editor.
-->
<script>
  import { _ } from 'svelte-i18n';
  import { getRandomId } from '$lib/services/util';
  import Button from '../button/button.svelte';
  import Divider from '../divider/divider.svelte';
  import Icon from '../icon/icon.svelte';
  import Toolbar from '../toolbar/toolbar.svelte';
  import TextArea from './text-area.svelte';

  /**
   * Make the text input container flexible.
   * @type {boolean}
   */
  export let flex = false;
  /**
   * Whether to hide the widget. An alias of the `aria-hidden` attribute.
   * @type {boolean | undefined}
   */
  export let hidden = undefined;
  /**
   * Whether to disable the widget. An alias of the `aria-disabled` attribute.
   * @type {boolean}
   */
  export let disabled = false;
  /**
   * Whether to disable the widget. An alias of `aria-readonly` attribute.
   * @type {boolean}
   */
  export let readonly = false;
  /**
   * Whether to mark the widget required. An alias of the `aria-required` attribute.
   * @type {boolean}
   */
  export let required = false;
  /**
   * Whether to mark the widget invalid. An alias of the `aria-invalid` attribute.
   * @type {boolean}
   */
  export let invalid = false;
  /**
   * Input value.
   * @type {string | undefined}
   */
  export let value = undefined;

  const id = getRandomId('editor');

  const defaultButtons = [
    { name: 'bold', label: $_('_sui.markdown_editor.bold'), icon: 'format_bold' },
    { name: 'italic', label: $_('_sui.markdown_editor.italic'), icon: 'format_italic' },
    { name: 'code', label: $_('_sui.markdown_editor.code'), icon: 'code' },
    { name: 'link', label: $_('_sui.markdown_editor.link'), icon: 'link' },
    { separator: true },
    {
      name: 'heading-one',
      label: $_('_sui.markdown_editor.heading_x', { values: { level: 1 } }),
      icon: 'format_h1',
    },
    {
      name: 'heading-two',
      label: $_('_sui.markdown_editor.heading_x', { values: { level: 2 } }),
      icon: 'format_h2',
    },
    { name: 'quote', label: $_('_sui.markdown_editor.quote'), icon: 'format_quote' },
    { separator: true },
    {
      name: 'bulleted-list',
      label: $_('_sui.markdown_editor.bulleted_list'),
      icon: 'format_list_bulleted',
    },
    {
      name: 'numbered-list',
      label: $_('_sui.markdown_editor.numbered_list'),
      icon: 'format_list_numbered',
    },
  ];
</script>

<div role="none" class="wrapper" hidden={hidden || undefined} {...$$restProps}>
  <div role="none" class="inner">
    <Toolbar
      disabled={disabled || readonly}
      aria-label={$_('_sui.markdown_editor.markdown_editor')}
    >
      {#each defaultButtons as { label, icon, separator }}
        {#if separator}
          <Divider />
        {:else}
          <Button iconic aria-label={label} aria-controls={id}>
            <Icon slot="start-icon" name={icon} />
          </Button>
        {/if}
      {/each}
    </Toolbar>
    <TextArea
      {id}
      autoResize={true}
      bind:value
      {flex}
      {hidden}
      {disabled}
      {readonly}
      {required}
      {invalid}
    />
  </div>
</div>

<style lang="scss">
  .wrapper {
    margin: var(--sui-focus-ring-width);
    width: calc(100% - var(--sui-focus-ring-width) * 2);

    :global([role='toolbar']) {
      display: flex;
      gap: 0;
      border-radius: 4px 4px 0 0;
      padding: 8px;
      background-color: var(--sui-tertiary-background-color);

      :global(button) {
        flex: none;
        margin: 0 !important;
      }

      & + :global(div) {
        width: 100%;

        :global(textarea) {
          border-radius: 0 0 4px 4px !important;
        }
      }
    }
  }

  .inner {
    display: contents;

    :global(.text-area) {
      margin: 0 !important;
      width: 100% !important;
    }
  }
</style>
