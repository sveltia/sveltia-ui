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

<section>
  <h3>Themes and contrast</h3>
  <p>
    The palette follows the system appearance by default. Set <code>data-theme="light"</code> or
    <code>data-theme="dark"</code> on the root element to pin it.
  </p>
  <p>
    A high-contrast variant of each theme is applied when the system asks for it (<code
      >prefers-contrast: more</code
    >). It raises every text colour to at least 7:1 and every control boundary to at least 3:1, and
    replaces the translucent hover, selection and placeholder treatments with solid ones. Set
    <code>data-contrast="more"</code>
    on the root element to turn it on regardless of the system setting, or any other value, such as
    <code>data-contrast="no-preference"</code>, to keep the standard palette.
  </p>
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
