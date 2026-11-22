<script>
  import { CopyButton } from '#lib';
  import Example from '../../_components/example.svelte';
</script>

<svelte:head>
  <title>Copy Button – Sveltia UI</title>
</svelte:head>

<h2>Copy Button</h2>

<section>
  <h3>Default</h3>
  <Example>
    <div role="none">
      <code>correct-horse-battery-staple</code>
      <CopyButton text="correct-horse-battery-staple" ariaLabel="Copy the password" />
    </div>
  </Example>
</section>

<section>
  <h3>Secondary</h3>
  <Example>
    <div role="none">
      <CopyButton variant="secondary" text="https://example.com/" />
    </div>
  </Example>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div role="none">
      <CopyButton text="Nothing to copy" disabled />
    </div>
  </Example>
</section>
