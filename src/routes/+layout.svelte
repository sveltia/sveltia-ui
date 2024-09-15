<script>
  import { isLoading } from 'svelte-i18n';
  import { AppShell, initLocales } from '$lib';
  import NavSection from './_components/nav-section.svelte';

  initLocales();

  /**
   * @typedef {object} Props
   * @property {import('svelte').Snippet} [children] - Primary slot content.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    children,
    /* eslint-enable prefer-const */
  } = $props();
</script>

{#if !$isLoading}
  <AppShell style="display: flex; flex-direction: column;">
    <header>
      <h1><a href="/">Sveltia UI</a></h1>
    </header>
    <div role="none" class="wrapper">
      <nav class="sidebar">
        <section>
          <h2>Basics</h2>
          <NavSection
            title="Style"
            category="basics"
            pages={[
              { key: 'colours', label: 'Colours' },
              { key: 'typography', label: 'Typography', disabled: true },
            ]}
          />
        </section>
        <section>
          <h2>Component Collection</h2>
          <NavSection
            title="Layout"
            category="components"
            pages={[
              { key: 'app-bar', label: 'App Bar', disabled: true },
              { key: 'box', label: 'Box', disabled: true },
              { key: 'divider', label: 'Divider' },
              { key: 'form', label: 'Form', disabled: true },
              { key: 'group', label: 'Group' },
              { key: 'landmarks', label: 'Landmarks', disabled: true },
              { key: 'spacer', label: 'Spacer' },
              { key: 'splitter', label: 'Splitter', disabled: true },
              { key: 'tiles', label: 'Tiles', disabled: true },
              { key: 'toolbar', label: 'Toolbar' },
            ]}
          />
          <NavSection
            title="Buttons"
            category="components"
            pages={[
              { key: 'button', label: 'Button' },
              { key: 'button-group', label: 'Button Group' },
              { key: 'copy-button', label: 'Copy Button', disabled: true },
              { key: 'spin-button', label: 'Spin Button', disabled: true },
              { key: 'split-button', label: 'Split Button' },
            ]}
          />
          <NavSection
            title="Inputs"
            category="components"
            pages={[
              { key: 'checkbox', label: 'Checkbox' },
              { key: 'color', label: 'Colour Picker', disabled: true },
              { key: 'date-time', label: 'Date/Time' },
              { key: 'emoji', label: 'Emoji Picker', disabled: true },
              { key: 'file', label: 'File Picker', disabled: true },
              { key: 'listbox', label: 'Listbox' },
              { key: 'radio', label: 'Radio' },
              { key: 'rating', label: 'Rating', disabled: true },
              { key: 'reaction', label: 'Reaction', disabled: true },
              { key: 'select', label: 'Select' },
              { key: 'slider', label: 'Slider' },
              { key: 'switch', label: 'Switch' },
              { key: 'text-editor', label: 'Text Editor' },
              { key: 'text-field', label: 'Text Field' },
            ]}
          />
          <NavSection
            title="Data Display"
            category="components"
            pages={[
              { key: 'accordion', label: 'Accordion', disabled: true },
              { key: 'card', label: 'Card', disabled: true },
              { key: 'carousel', label: 'Carousel', disabled: true },
              { key: 'chart', label: 'Chart', disabled: true },
              { key: 'code', label: 'Code', disabled: true },
              { key: 'disclosure', label: 'Disclosure' },
              { key: 'empty-state', label: 'Empty State', disabled: true },
              { key: 'feed', label: 'Feed', disabled: true },
              { key: 'grid', label: 'Grid' },
              { key: 'list', label: 'List', disabled: true },
              { key: 'map', label: 'Map', disabled: true },
              { key: 'meter', label: 'Meter', disabled: true },
              { key: 'popover', label: 'Popover', disabled: true },
              { key: 'table', label: 'Table' },
              { key: 'tag', label: 'Tag', disabled: true },
              { key: 'tooltip', label: 'Tooltip', disabled: true },
              { key: 'tree', label: 'Tree', disabled: true },
              { key: 'tree-grid', label: 'Tree Grid', disabled: true },
            ]}
          />
          <NavSection
            title="Media Display"
            category="components"
            pages={[
              { key: 'audio', label: 'Audio Player', disabled: true },
              { key: 'avatar', label: 'Avatar', disabled: true },
              { key: 'icon', label: 'Icon' },
              { key: 'image', label: 'Image', disabled: true },
              { key: 'lightbox', label: 'Lightbox', disabled: true },
              { key: 'video', label: 'Video Player', disabled: true },
            ]}
          />
          <NavSection
            title="Feedback"
            category="components"
            pages={[
              { key: 'inline-alert', label: 'Inline Alert' },
              { key: 'dialog', label: 'Dialog' },
              { key: 'toast', label: 'Toast' },
              { key: 'progress', label: 'Progress', disabled: true },
              { key: 'skeleton', label: 'Skeleton', disabled: true },
              { key: 'spinner', label: 'Spinner', disabled: true },
              { key: 'statusbar', label: 'Statusbar', disabled: true },
            ]}
          />
          <NavSection
            title="Navigation"
            category="components"
            pages={[
              { key: 'bottom-nav', label: 'Bottom Navigation', disabled: true },
              { key: 'breadcrumbs', label: 'Breadcrumbs', disabled: true },
              { key: 'drawer', label: 'Drawer' },
              { key: 'link', label: 'Link', disabled: true },
              { key: 'menu', label: 'Menu' },
              { key: 'pagination', label: 'Pagination', disabled: true },
              { key: 'scrollable-strip', label: 'Scrollable Strip', disabled: true },
              { key: 'tabs', label: 'Tabs' },
              { key: 'tour', label: 'Tour', disabled: true },
              { key: 'wizard', label: 'Wizard', disabled: true },
            ]}
          />
        </section>
        <section>
          <h2>Component API</h2>
        </section>
      </nav>
      <main>
        {@render children?.()}
      </main>
    </div>
  </AppShell>
{/if}

<style lang="scss">
  header {
    flex: none;
    padding: 16px 32px;
    border-bottom: 1px solid var(--sui-secondary-border-color);
    background-color: var(--sui-secondary-background-color);

    h1 {
      font-size: var(--sui-font-size-large);

      a {
        color: inherit;
      }
    }
  }

  .wrapper {
    flex: auto;
    display: flex;
    overflow: hidden;
  }

  .sidebar {
    flex: none;
    overflow-y: auto;
    padding: 0;
    width: 320px;
    background-color: var(--sui-secondary-background-color);

    section {
      padding: 32px;

      &:not(:first-child) {
        border-top: 1px solid var(--sui-secondary-border-color);
      }

      h2 {
        margin: 0 0 16px;
        font-size: 16px;
      }
    }
  }

  main {
    flex: auto;
    overflow-y: auto;
    padding: 32px;

    & > :global(section) {
      margin: 32px 0 0;

      :global(h4) {
        margin: 8px 0;

        & ~ :global(div) {
          margin: 8px 0;
        }
      }
    }
  }
</style>
