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
  on:dragover|preventDefault
  on:drop|preventDefault
  on:contextmenu={(event) => {
    // Disable the native context menu
    if (!event.target?.matches('input[type="text"], textarea')) {
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
    color: var(--primary-foreground-color);
    background-color: var(--primary-background-color);
    font-family: var(--font-family--default);
    font-size: var(--font-size--default);
    font-weight: var(--font-weight--normal);
    -webkit-user-select: none;
    user-select: none;
    touch-action: none;
    overflow-anchor: none;
    cursor: default;
  }
</style>
