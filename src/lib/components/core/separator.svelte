<!--
  @component
  @see https://w3c.github.io/aria/#separator
-->
<script>
  export let orientation = 'horizontal';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };
</script>

<div role="separator" class="sui separator {className}" aria-orientation={orientation} />

<style lang="scss">
  .separator {
    flex: none;
    background-color: var(--secondary-border-color);

    &[aria-orientation='horizontal'] {
      height: 1px;
    }

    &[aria-orientation='vertical'] {
      width: 1px;
    }
  }
</style>
