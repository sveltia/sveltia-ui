<!--
  @component
  Test fixture: a component rendered with its props spread onto it, the way a wrapper passes its
  rest props along. Replacing `attrs` with a new object makes Svelte read every prop of the
  component again, as a changed spread does.
-->
<script>
  /**
   * @import { Component } from 'svelte';
   */

  /**
   * @type {{
   * component: Component<any>,
   * attrs: Record<string, any>,
   * value?: any,
   * }}
   */
  let {
    /* eslint-disable prefer-const */
    component: Target,
    attrs,
    value = $bindable(),
    /* eslint-enable prefer-const */
  } = $props();
</script>

<Target {...attrs} bind:value />
