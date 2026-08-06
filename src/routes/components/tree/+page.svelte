<script>
  import { Icon, Tree, TreeItem } from '$lib';
  import Example from '../../_components/example.svelte';

  /**
   * @typedef {object} Node
   * @property {string} label Text label.
   * @property {boolean} [expanded] Whether to expand the node by default.
   * @property {Node[]} [children] Child nodes.
   */

  /**
   * @type {Node[]}
   */
  const nodes = [
    {
      label: 'Documents',
      expanded: true,
      children: [
        {
          label: 'Reports',
          children: [{ label: 'Q1.pdf' }, { label: 'Q2.pdf' }, { label: 'Q3.pdf' }],
        },
        { label: 'Notes.txt' },
        { label: 'Todo.md' },
      ],
    },
    {
      label: 'Pictures',
      children: [{ label: 'Beach.jpg' }, { label: 'Mountain.jpg' }],
    },
    { label: 'Readme.md' },
  ];

  /**
   * Selected item label, updated with the `Change` event on the tree.
   * @type {string | undefined}
   */
  let selectedLabel = $state();
</script>

<h2>Tree</h2>

<section>
  <h3>Default</h3>
  <Example>
    <div role="none">
      <Tree ariaLabel="File system">
        <TreeItem label="Documents" expanded>
          {#snippet items()}
            <TreeItem label="Reports">
              {#snippet items()}
                <TreeItem label="Q1.pdf" />
                <TreeItem label="Q2.pdf" />
                <TreeItem label="Q3.pdf" />
              {/snippet}
            </TreeItem>
            <TreeItem label="Notes.txt" selected />
            <TreeItem label="Todo.md" />
          {/snippet}
        </TreeItem>
        <TreeItem label="Pictures">
          {#snippet items()}
            <TreeItem label="Beach.jpg" />
            <TreeItem label="Mountain.jpg" />
          {/snippet}
        </TreeItem>
        <TreeItem label="Readme.md" />
      </Tree>
    </div>
  </Example>
</section>

<section>
  <h3>Multi Select</h3>
  <Example>
    <div role="none">
      <Tree ariaLabel="Fruits and vegetables" multiple>
        <TreeItem label="Fruits" expanded>
          {#snippet items()}
            <TreeItem label="Apple" selected />
            <TreeItem label="Banana" />
            <TreeItem label="Cherry" selected />
          {/snippet}
        </TreeItem>
        <TreeItem label="Vegetables" expanded>
          {#snippet items()}
            <TreeItem label="Broccoli" />
            <TreeItem label="Carrot" />
            <TreeItem label="Potato" disabled />
          {/snippet}
        </TreeItem>
      </Tree>
    </div>
  </Example>
</section>

<section>
  <h3>With Icons</h3>
  <Example>
    <div role="none">
      <Tree ariaLabel="Project files">
        <TreeItem label="src" expanded>
          {#snippet startIcon()}
            <Icon name="folder" />
          {/snippet}
          {#snippet items()}
            <TreeItem label="index.js">
              {#snippet startIcon()}
                <Icon name="draft" />
              {/snippet}
            </TreeItem>
            <TreeItem label="styles.css">
              {#snippet startIcon()}
                <Icon name="draft" />
              {/snippet}
            </TreeItem>
          {/snippet}
        </TreeItem>
        <TreeItem label="package.json">
          {#snippet startIcon()}
            <Icon name="draft" />
          {/snippet}
        </TreeItem>
      </Tree>
    </div>
  </Example>
</section>

<section>
  <h3>Dynamic Items</h3>
  <Example>
    <div role="none">
      {#snippet node(/** @type {Node} */ item)}
        {#if item.children?.length}
          <TreeItem label={item.label} expanded={item.expanded}>
            {#snippet items()}
              {#each item.children ?? [] as child (child.label)}
                {@render node(child)}
              {/each}
            {/snippet}
          </TreeItem>
        {:else}
          <TreeItem label={item.label} />
        {/if}
      {/snippet}
      <Tree
        ariaLabel="File system"
        onChange={(event) => {
          selectedLabel = event.detail.label;
        }}
      >
        {#each nodes as item (item.label)}
          {@render node(item)}
        {/each}
      </Tree>
      <p>Selected: {selectedLabel ?? 'None'}</p>
    </div>
  </Example>
</section>

<section>
  <h3>Without Expanding on Select</h3>
  <Example>
    <div role="none">
      <Tree ariaLabel="File system" expandOnSelect={false}>
        <TreeItem label="Documents" expanded>
          {#snippet items()}
            <TreeItem label="Notes.txt" />
            <TreeItem label="Todo.md" />
          {/snippet}
        </TreeItem>
        <TreeItem label="Readme.md" />
      </Tree>
    </div>
  </Example>
</section>

<section>
  <h3>Read-only</h3>
  <Example>
    <div role="none">
      <Tree ariaLabel="File system" readonly>
        <TreeItem label="Documents" expanded>
          {#snippet items()}
            <TreeItem label="Notes.txt" selected />
            <TreeItem label="Todo.md" />
          {/snippet}
        </TreeItem>
        <TreeItem label="Readme.md" />
      </Tree>
    </div>
  </Example>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div role="none">
      <Tree ariaLabel="File system" disabled>
        <TreeItem label="Documents" expanded>
          {#snippet items()}
            <TreeItem label="Notes.txt" selected />
            <TreeItem label="Todo.md" />
          {/snippet}
        </TreeItem>
        <TreeItem label="Readme.md" />
      </Tree>
    </div>
  </Example>
</section>
