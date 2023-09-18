<!--
  @component
  Provide an application’s shell that makes the web app more like a native app. It also handles the
  dark/light mode switching. This component has to be placed directly under `<body>` (or
  `<div style="display:contents">` in a SvelteKit app).
-->
<script>
  import { onMount } from 'svelte';

  onMount(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const { dataset } = document.documentElement;

    /**
     *
     */
    const applyTheme = () => {
      if (dataset.autoTheming !== 'false') {
        dataset.theme = mediaQuery.matches ? 'dark' : 'light';
      }
    };

    applyTheme();

    /**
     *
     */
    mediaQuery.onchange = () => {
      applyTheme();
    };
  });
</script>

<div
  class="sui app-shell"
  role="none"
  {...$$restProps}
  on:dragover|preventDefault
  on:drop|preventDefault
  on:contextmenu={(event) => {
    // Enable the native context menu only in the developer mode or on text fields
    if (
      !document.documentElement.matches('[data-env="dev"]') &&
      !(/** @type {HTMLElement} */ (event.target)?.matches('input[type="text"], textarea'))
    ) {
      event.preventDefault();
    }
  }}
>
  <slot />
</div>

<style lang="scss" global>
  @use '../../styles/core.scss';

  .app-shell {
    position: fixed;
    inset: 0;
    overflow: hidden;
    width: 100%;
    height: 100%;
    color: var(--sui-primary-foreground-color);
    background-color: var(--sui-primary-background-color);
    font-family: var(--sui-font-family-default);
    font-size: var(--sui-font-size-default);
    font-weight: var(--sui-font-weight-normal);
    -webkit-user-select: none;
    user-select: none;
    touch-action: none;
    cursor: default;
  }
</style>
