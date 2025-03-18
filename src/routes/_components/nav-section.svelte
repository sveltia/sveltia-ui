<script>
  import { page } from '$app/state';

  /**
   * @typedef {object} Props
   * @property {string} title Title for the section.
   * @property {string} category Category name.
   * @property {{ key: string, label: string, disabled?: boolean }[]} pages Page list.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    title = '',
    category = '',
    pages = [],
    /* eslint-enable prefer-const */
  } = $props();
</script>

<section>
  <h3>{title}</h3>
  <ul>
    {#each pages as { key, label, disabled } (key)}
      {@const current = page.url.pathname === `/components/${key}`}
      <li>
        {#if disabled}
          {label}
        {:else}
          <a href="/{category}/{key}" aria-current={current ? 'page' : undefined}>
            {label}
          </a>
        {/if}
      </li>
    {/each}
  </ul>
</section>

<style lang="scss">
  section {
    &:not(:last-child) {
      padding: 0 0 24px;
    }
  }

  h3 {
    margin: 0 0 8px;
    padding: 0 0 4px;
    color: var(--sui-tertiary-foreground-color);
    font-size: 12px;
    font-weight: var(--sui-font-weight-normal, normal);
    text-transform: uppercase;
    letter-spacing: 0.1ex;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    margin: 4px 0 0;
    padding: 0;
  }

  [aria-current='page'] {
    font-weight: var(--sui-font-weight-bold, bold);
    text-decoration: underline;
  }
</style>
