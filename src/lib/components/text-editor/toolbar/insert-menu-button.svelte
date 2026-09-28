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
  import { insertComponent } from '../raw-markdown.js';

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
            const { textArea, useRichText } = editorStore;

            // Insert the component’s Markdown in the plain text mode
            if (!useRichText) {
              // The item is only clickable while the `<textarea>` is there
              /* v8 ignore else */
              if (textArea) {
                insertComponent(textArea, component);
              }

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
