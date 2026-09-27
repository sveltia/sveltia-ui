<script>
  import { _ } from '@sveltia/i18n';
  import {
    $createParagraphNode as createParagraphNode,
    $insertNodes as insertNodes,
  } from 'lexical';
  import { getContext } from 'svelte';
  import Icon from '../../icon/icon.svelte';
  import MenuButton from '../../menu/menu-button.svelte';
  import MenuItem from '../../menu/menu-item.svelte';
  import Menu from '../../menu/menu.svelte';
  import InsertComponentDialog from './insert-component-dialog.svelte';

  /**
   * @import { TextEditorComponent, TextEditorStore } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {TextEditorComponent[]} components Editor components.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    components,
    /* eslint-enable prefer-const */
  } = $props();

  /** @type {TextEditorStore} */
  const editorStore = getContext('editorStore');

  /**
   * Component to insert with the dialog in the plain text mode.
   * @type {TextEditorComponent | undefined}
   */
  let dialogComponent = $state();
  let openDialog = $state(false);
</script>

<MenuButton label={_('_sui.insert')}>
  {#snippet endIcon()}
    <Icon name="arrow_drop_down" class="small-arrow" />
  {/snippet}
  {#snippet popup()}
    <Menu>
      {#each components as component (component.id)}
        {@const { label, icon, createNode } = component}
        <MenuItem
          {label}
          onclick={() => {
            // The plain text mode needs a dialog to fill in the component’s fields
            if (!editorStore.useRichText) {
              dialogComponent = component;
              openDialog = true;

              return;
            }

            editorStore.editor?.update(() => {
              // Add an additional paragraph for easier editing
              insertNodes([createNode(), createParagraphNode()]);
            });
          }}
        >
          {#snippet startIcon()}
            {#if icon}
              <Icon name={icon} />
            {/if}
          {/snippet}
        </MenuItem>
      {/each}
    </Menu>
  {/snippet}
</MenuButton>

<InsertComponentDialog component={dialogComponent} bind:open={openDialog} />
