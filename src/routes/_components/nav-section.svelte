<script>
  import { page } from '$app/stores';

  export let title = '';
  export let category = '';
  /** @type {{ key: string, label: string, disabled?: boolean }[]} */
  export let pages = [];
</script>

<section>
  <h3>{title}</h3>
  <ul>
    {#each pages as { key, label, disabled } (key)}
      {@const current = $page.url.pathname === `/components/${key}`}
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
    font-weight: normal;
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
    font-weight: bold;
    text-decoration: underline;
  }
</style>
