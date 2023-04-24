<script>
  import { isLoading } from 'svelte-i18n';
  import { AppShell, initLocales } from '$lib';

  initLocales();
</script>

{#if !$isLoading}
  <AppShell>
    <slot />
  </AppShell>
{/if}
