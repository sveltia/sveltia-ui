<!--
  @component
  Test fixture: provides an editor store, with a live Lexical editor behind it, to a toolbar
  component under test, the way `<TextEditor>` and `<CodeEditor>` do.
-->
<script>
  import { setContext } from 'svelte';
  import { BLOCK_BUTTON_TYPES, INLINE_BUTTON_TYPES } from './constants.js';
  import LexicalRoot from './lexical-root.svelte';
  import { createEditorStore } from './store.svelte.js';

  /**
   * @import { Component } from 'svelte';
   * @import { TextEditorConfig, TextEditorStore } from '$lib/typedefs';
   */

  /**
   * @type {{
   * store?: TextEditorStore,
   * config?: Partial<TextEditorConfig>,
   * component?: Component<any>,
   * componentProps?: Record<string, any>,
   * withRoot?: boolean,
   * }}
   */
  let {
    /* eslint-disable prefer-const */
    store = $bindable(),
    config = {},
    component = undefined,
    componentProps = {},
    withRoot = true,
    /* eslint-enable prefer-const */
  } = $props();

  const _store = createEditorStore();

  // svelte-ignore state_referenced_locally
  _store.config = {
    ..._store.config,
    modes: ['rich-text', 'plain-text'],
    enabledButtons: [...INLINE_BUTTON_TYPES, ...BLOCK_BUTTON_TYPES],
    ...config,
  };

  setContext('editorStore', _store);
  // svelte-ignore state_referenced_locally
  store = _store;

  const Component = $derived(component);
</script>

{#if withRoot}
  <LexicalRoot />
{/if}
{#if Component}
  <Component {...componentProps} />
{/if}
