<script>
  import { _ } from 'svelte-i18n';
  import Button from '../core/button.svelte';
  import Icon from '../core/icon.svelte';
  import Separator from '../core/separator.svelte';
  import TextArea from '../core/text-area.svelte';
  import Toolbar from '../core/toolbar.svelte';

  /** @type {(String|undefined)} */
  export let value = undefined;

  export let disabled = false;

  const defaultButtons = [
    { name: 'bold', label: $_('sui.markdown_editor.bold'), icon: 'format_bold' },
    { name: 'italic', label: $_('sui.markdown_editor.italic'), icon: 'format_italic' },
    { name: 'code', label: $_('sui.markdown_editor.code'), icon: 'code' },
    { name: 'link', label: $_('sui.markdown_editor.link'), icon: 'link' },
    { separator: true },
    {
      name: 'heading-one',
      label: $_('sui.markdown_editor.heading_x', { values: { level: 1 } }),
      icon: 'format_h1',
    },
    {
      name: 'heading-two',
      label: $_('sui.markdown_editor.heading_x', { values: { level: 2 } }),
      icon: 'format_h2',
    },
    { name: 'quote', label: $_('sui.markdown_editor.quote'), icon: 'format_quote' },
    { separator: true },
    {
      name: 'bulleted-list',
      label: $_('sui.markdown_editor.bulleted_list'),
      icon: 'format_list_bulleted',
    },
    {
      name: 'numbered-list',
      label: $_('sui.markdown_editor.numbered_list'),
      icon: 'format_list_numbered',
    },
  ];
</script>

<div>
  <Toolbar aria-label={$_('sui.markdown_editor.markdown_editor')}>
    {#each defaultButtons as { label, icon, separator }}
      {#if separator}
        <Separator />
      {:else}
        <Button {disabled}>
          <Icon slot="start-icon" name={icon} {label} />
        </Button>
      {/if}
    {/each}
  </Toolbar>
  <TextArea autoResize={true} {disabled} bind:value />
</div>

<style lang="scss">
  div {
    display: contents;

    :global([role='toolbar']) {
      display: flex;
      gap: 8px;
      border-radius: 4px 4px 0 0;
      padding: 8px;
      background-color: var(--ternary-background-color);

      :global(button) {
        flex: none;
      }

      & + :global(div) {
        width: 100%;

        :global(textarea) {
          border-radius: 0 0 4px 4px !important;
        }
      }
    }
  }
</style>
