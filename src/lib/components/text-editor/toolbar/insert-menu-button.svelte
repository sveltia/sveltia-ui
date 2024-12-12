<script>
  import { $insertNodes as insertNodes } from 'lexical';
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import Icon from '../../icon/icon.svelte';
  import MenuButton from '../../menu/menu-button.svelte';
  import MenuItem from '../../menu/menu-item.svelte';
  import Menu from '../../menu/menu.svelte';

  /**
   * @typedef {object} Props
   * @property {import('$lib/typedefs').TextEditorComponent[]} components - Editor components.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    components,
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * Text editor state.
   * @type {import('$lib/typedefs').TextEditorState}
   */
  const { editor, useRichText } = getContext('state');
</script>

<MenuButton disabled={!$useRichText} label={$_('_sui.insert')}>
  {#snippet endIcon()}
    <Icon name="arrow_drop_down" class="small-arrow" />
  {/snippet}
  {#snippet popup()}
    <Menu>
      {#each components as { id, label, icon, createNode } (id)}
        <MenuItem
          {label}
          onclick={() => {
            $editor.update(() => {
              insertNodes([createNode()]);
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
