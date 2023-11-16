<script>
  import Example from '../../_components/example.svelte';
</script>

<h2>Colours</h2>

<section>
  <h3>Background</h3>
  <Example>
    <div role="none" class="color-samples">
      <span role="none" class="sample" style:background-color="var(--sui-primary-background-color)">
        Primary
      </span>
      <span
        role="none"
        class="sample"
        style:background-color="var(--sui-secondary-background-color)"
      >
        Secondary
      </span>
      <span
        role="none"
        class="sample"
        style:background-color="var(--sui-tertiary-background-color)"
      >
        tertiary
      </span>
      <span
        role="none"
        class="sample"
        style:background-color="var(--sui-disabled-background-color)"
      >
        Disabled
      </span>
    </div>
  </Example>
</section>
<section>
  <h3>Foreground</h3>
  <Example>
    <div role="none" class="color-samples">
      <span role="none" class="sample" style:color="var(--sui-primary-foreground-color)">
        Primary
      </span>
      <span role="none" class="sample" style:color="var(--sui-secondary-foreground-color)">
        Secondary
      </span>
      <span role="none" class="sample" style:color="var(--sui-tertiary-foreground-color)">
        Tertiary
      </span>
      <span role="none" class="sample" style:color="var(--sui-disabled-foreground-color)">
        Disabled
      </span>
    </div>
  </Example>
</section>
<section>
  <h3>Alerts</h3>
  <Example>
    <div role="none" class="color-samples">
      <span
        role="none"
        class="sample"
        style:border-color="var(--sui-error-border-color)"
        style:color="var(--sui-error-foreground-color)"
        style:background-color="var(--sui-error-background-color)"
      >
        Error / Danger
      </span>
      <span
        role="none"
        class="sample"
        style:border-color="var(--sui-warning-border-color)"
        style:color="var(--sui-warning-foreground-color)"
        style:background-color="var(--sui-warning-background-color)"
      >
        Warning
      </span>
      <span
        role="none"
        class="sample"
        style:border-color="var(--sui-info-border-color)"
        style:color="var(--sui-info-foreground-color)"
        style:background-color="var(--sui-info-background-color)"
      >
        Info
      </span>
      <span
        role="none"
        class="sample"
        style:border-color="var(--sui-success-border-color)"
        style:color="var(--sui-success-foreground-color)"
        style:background-color="var(--sui-success-background-color)"
      >
        Success
      </span>
    </div>
  </Example>
</section>

<style lang="scss">
  .color-samples {
    display: flex;
    gap: 8px;
    background-color: var(--sui-content-background-color);
    padding: 8px;

    .sample {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      border-width: 1px;
      border-color: var(--sui-secondary-border-color);
      border-radius: 8px;
      min-width: 160px;
      min-height: 48px;
    }
  }
</style>
