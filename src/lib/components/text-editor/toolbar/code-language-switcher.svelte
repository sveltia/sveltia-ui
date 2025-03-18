<script>
  import { $isCodeNode as isCodeNode } from '@lexical/code';
  import { $getNodeByKey as getNodeByKey, $getRoot as getRoot } from 'lexical';
  import prismComponents from 'prismjs/components';
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import Option from '../../listbox/option.svelte';
  import Select from '../../select/select.svelte';
  import { focusEditor, loadCodeHighlighter } from '../core';

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
  const codeLanguages = Object.entries(prismComponents.languages)
    .filter(([, config]) => 'title' in config)
    .map(([key, val]) => {
      const { title: label, aliasTitles, alias } = /** @type {Record<string, any>} */ (val);
      let aliases = [];

      if (alias && !aliasTitles) {
        aliases = Array.isArray(alias) ? alias : [alias];
      }

      return [
        { key, label, aliases },
        ...Object.entries(aliasTitles ?? {}).map(([k, v]) => ({ key: k, label: v, aliases: [] })),
      ];
    })
    .flat(1)
    .sort((a, b) => a.label.localeCompare(b.label));

  /** @type {TextEditorStore} */
  const editorStore = getContext('editorStore');

  let selectedLanguage = $state('');

  $effect(() => {
    void editorStore.selection.blockNodeKey;

    editorStore.editor?.read(() => {
      const node = editorStore.config.isCodeEditor
        ? getRoot().getChildren()[0]
        : getNodeByKey(/** @type {string} */ (editorStore.selection.blockNodeKey));

      if (isCodeNode(node)) {
        selectedLanguage = node.getLanguage() ?? editorStore.config.defaultLanguage ?? '';
      }
    });
  });
</script>

<Select
  {disabled}
  aria-label={$_('_sui.text_editor.language')}
  value={selectedLanguage}
  onChange={async ({ detail: { value: lang } }) => {
    if (!editorStore.editor || selectedLanguage === lang) {
      return;
    }

    await focusEditor(editorStore.editor);

    if (editorStore.selection?.blockNodeKey) {
      await loadCodeHighlighter(lang);

      editorStore.editor.update(() => {
        // https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/ToolbarPlugin/index.tsx#L713
        const node = getNodeByKey(/** @type {string} */ (editorStore.selection.blockNodeKey));

        if (isCodeNode(node)) {
          node.setLanguage(lang);
          selectedLanguage = lang;
        }
      });
    }
  }}
>
  <Option label={$_('_sui.text_editor.plain_text')} value="" />
  {#each codeLanguages as { key, label, aliases } (key)}
    <Option
      {label}
      value={key}
      selected={key === selectedLanguage || aliases.includes(selectedLanguage)}
    />
  {/each}
</Select>
