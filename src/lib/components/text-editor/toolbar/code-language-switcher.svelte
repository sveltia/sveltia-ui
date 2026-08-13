<script>
  import { $isCodeNode as isCodeNode } from '@lexical/code-core';
  import { _ } from '@sveltia/i18n';
  import { $getNodeByKey as getNodeByKey, $getRoot as getRoot } from 'lexical';
  import { getContext } from 'svelte';
  import Option from '../../listbox/option.svelte';
  import Select from '../../select/select.svelte';
  import { focusEditor, loadCodeHighlighter } from '../core.js';
  import { LANGUAGES } from '../shiki/generated.js';

  /**
   * @import { TextEditorStore } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {boolean} [disabled] Whether to disable the switcher.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    disabled = false,
    /* eslint-enable prefer-const */
  } = $props();

  /** @type {{ key: string, label: string, aliases: string[] }[]} */
  const codeLanguages = LANGUAGES.map(({ id, name, aliases = [] }) => ({
    key: id,
    label: name,
    aliases,
  }));

  /** @type {TextEditorStore} */
  const editorStore = getContext('editorStore');

  let selectedLanguage = $state('plain');

  $effect(() => {
    void editorStore.selection.blockNodeKey;

    editorStore.editor?.read(() => {
      const node = editorStore.config.isCodeEditor
        ? getRoot().getChildren()[0]
        : getNodeByKey(/** @type {string} */ (editorStore.selection.blockNodeKey));

      if (isCodeNode(node)) {
        selectedLanguage = node.getLanguage() ?? editorStore.config.defaultLanguage ?? 'plain';
      }
    });
  });
</script>

<Select
  {disabled}
  aria-label={_('_sui.text_editor.language')}
  value={selectedLanguage}
  onChange={async ({ detail: { value: lang } }) => {
    if (!editorStore.editor || selectedLanguage === lang) {
      return;
    }

    await focusEditor(editorStore.editor);
    await loadCodeHighlighter(lang);

    editorStore.editor.update(() => {
      // Resolve the target the same way the effect above does. A code editor has exactly one code
      // block, and its `blockNodeKey` is still unset the first time the switcher is used, before
      // the editor has ever been focused.
      // https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/ToolbarPlugin/index.tsx#L713
      const { blockNodeKey } = editorStore.selection;

      const node = editorStore.config.isCodeEditor
        ? getRoot().getChildren()[0]
        : blockNodeKey
          ? getNodeByKey(blockNodeKey)
          : null;

      if (isCodeNode(node)) {
        node.setLanguage(lang);
        selectedLanguage = lang;
      }
    });
  }}
>
  <Option label={_('_sui.text_editor.plain_text')} value="plain" dir="ltr" />
  {#each codeLanguages as { key, label, aliases } (key)}
    <Option
      {label}
      value={key}
      selected={key === selectedLanguage || aliases.includes(selectedLanguage)}
      dir="ltr"
    />
  {/each}
</Select>
