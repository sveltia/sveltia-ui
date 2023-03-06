<script>
  import { isLoading } from 'svelte-i18n';
  import { AppShell } from '$lib';
</script>

{#if !$isLoading}
  <AppShell>
    <slot />
  </AppShell>
{/if}
