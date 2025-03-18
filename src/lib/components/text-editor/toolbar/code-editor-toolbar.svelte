<script>
  import { _ } from 'svelte-i18n';
  import CodeLanguageSwitcher from './code-language-switcher.svelte';
  import ToolbarWrapper from './toolbar-wrapper.svelte';

  /**
   * @typedef {object} Props
   * @property {boolean} [hidden] Whether to hide the widget.
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {boolean} [readonly] Whether to make the widget read-only. An alias of the
   * `aria-readonly` attribute.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    disabled = false,
    readonly = false,
    /* eslint-enable prefer-const */
  } = $props();
</script>

<ToolbarWrapper disabled={disabled || readonly} aria-label={$_('_sui.text_editor.code_editor')}>
  <CodeLanguageSwitcher disabled={disabled || readonly} />
</ToolbarWrapper>
