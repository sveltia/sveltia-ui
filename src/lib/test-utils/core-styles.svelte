<!--
  @component
  Carries the library’s global stylesheet into the browser tests. The stylesheet is normally
  brought in by `<AppShell>`, which the components under test are rendered without, but they rely
  on the custom properties it defines for their sizes and positions. Importing this component is
  enough for the styles to be added to the document; it renders nothing.
-->
<style lang="scss">
  @use '../styles/core';
</style>
