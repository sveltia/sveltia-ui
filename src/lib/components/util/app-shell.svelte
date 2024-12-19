<!--
  @component
  Provide an application’s shell that makes the web app more like a native app. It also handles the
  dark/light mode switching. This component has to be placed directly under `<body>` (or
  `<div style="display:contents">` in a SvelteKit app).
-->
<script>
  import { onMount } from 'svelte';

  /**
   * @typedef {object} Props
   * @property {'horizontal' | 'vertical' | undefined} [orientation] - Orientation of the app
   * shell’s children..
   * @property {import('svelte').Snippet} [children] - Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    orientation = 'horizontal',
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const stylesheets = [
    // https://fonts.google.com/share?selection.family=Merriweather%20Sans:ital,wght@0,300;0,600;1,300%7CNoto%20Sans%20Mono
    'https://fonts.googleapis.com/css2?family=Merriweather+Sans:ital,wght@0,300;0,600;1,300&family=Noto+Sans+Mono&display=swap',
    // https://fonts.google.com/icons?icon.set=Material+Symbols
    // Use `font-display: block;` @see https://stackoverflow.com/q/41710834
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block',
  ];

  /** @type {HTMLElement | undefined} */
  let fontLoader = $state();

  onMount(() => {
    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');
    const { dataset } = document.documentElement;

    /**
     * Apply the Dark or Light theme.
     */
    const applyTheme = () => {
      if (dataset.autoTheming !== 'false') {
        dataset.theme = mediaQuery.matches ? 'dark' : 'light';
      }
    };

    applyTheme();

    // eslint-disable-next-line jsdoc/require-jsdoc
    mediaQuery.onchange = () => {
      applyTheme();
    };

    globalThis.setTimeout(() => {
      fontLoader?.remove();
    }, 1000);
  });
</script>

<svelte:head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="google" content="notranslate" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  {#each stylesheets as href}
    <link rel="preload" {href} as="style" />
    <link rel="stylesheet" {href} />
  {/each}
</svelte:head>

<!-- Preload fonts, including the icons -->
<div bind:this={fontLoader} class="font-loader" aria-hidden="true" style:opacity="0">
  Loading <strong>Sveltia</strong> <em>UI</em>
  <span role="none" class="material-symbols-outlined">favorite</span>
</div>

<div
  {...restProps}
  role="none"
  class="sui app-shell {orientation}"
  ondragover={(event) => event.preventDefault()}
  ondrop={(event) => event.preventDefault()}
  oncontextmenu={(event) => {
    // Enable the native context menu only in the developer mode or on text fields
    if (
      !document.documentElement.matches('[data-env="dev"]') &&
      !(/** @type {HTMLElement} */ (event.target)?.matches('input[type="text"], textarea'))
    ) {
      event.preventDefault();
    }
  }}
>
  {@render children?.()}
</div>

<style lang="scss">
  @use '../../styles/core';

  .font-loader {
    position: absolute;
    left: -99999px;
    font-family: var(--sui-font-family-default);
  }

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
    font-weight: var(--sui-font-weight-normal, normal);
    word-spacing: var(--sui-word-spacing-normal);
    -webkit-user-select: none;
    user-select: none;
    touch-action: none;
    cursor: default;

    &.horizontal {
      display: flex;
      flex-direction: row;
      overflow: hidden;
    }

    &.vertical {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
  }
</style>
