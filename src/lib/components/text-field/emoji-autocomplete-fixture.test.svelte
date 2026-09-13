<!--
  @component
  Test fixture: a plain `<input>` or `<textarea>` with the emoji autocomplete attached.
-->
<script>
  import EmojiAutocomplete from './emoji-autocomplete.svelte';

  /** @type {{ multiline?: boolean, disabled?: boolean, attached?: boolean }} */
  const { multiline = false, disabled = false, attached = true } = $props();

  /** @type {HTMLInputElement | HTMLTextAreaElement | undefined} */
  let element = $state();
</script>

{#if multiline}
  <textarea bind:this={element} aria-label="Field" {disabled}></textarea>
{:else}
  <input bind:this={element} aria-label="Field" {disabled} />
{/if}
{#if attached}
  <EmojiAutocomplete {element} />
{/if}
