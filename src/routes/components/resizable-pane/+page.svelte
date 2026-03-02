<script>
  import { ResizableHandle, ResizablePane, ResizablePaneGroup } from '$lib';
  import Example from '../../_components/example.svelte';

  /** @type {string[]} */
  let eventLog = $state([]);

  /**
   * Append a message to the event log (max 5 entries).
   * @param {string} msg Log message.
   */
  const log = (msg) => {
    eventLog = [msg, ...eventLog].slice(0, 5);
  };
</script>

<h2>Resizable Pane</h2>

<section>
  <h3>Horizontal (Default)</h3>
  <p>
    Drag the handle or focus it and use <kbd>←</kbd>/<kbd>→</kbd> arrow keys to resize. Hold
    <kbd>Shift</kbd> for larger steps. <kbd>Enter</kbd> collapses/restores the pane;
    <kbd>Home</kbd>/<kbd>End</kbd> jump to minimum/maximum size.
  </p>
  <Example>
    <div role="none" style="height: 200px;">
      <ResizablePaneGroup direction="horizontal">
        <ResizablePane
          defaultSize={30}
          minSize={15}
          style="padding: 12px; background: var(--sui-tertiary-background-color);"
        >
          Left pane
        </ResizablePane>
        <ResizableHandle aria-label="Left pane size" />
        <ResizablePane
          defaultSize={40}
          minSize={15}
          style="padding: 12px; background: var(--sui-secondary-background-color);"
        >
          Center pane
        </ResizablePane>
        <ResizableHandle aria-label="Center pane size" />
        <ResizablePane
          minSize={15}
          style="padding: 12px; background: var(--sui-tertiary-background-color);"
        >
          Right pane (auto-sized)
        </ResizablePane>
      </ResizablePaneGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Vertical</h3>
  <p>
    Drag the handle or focus it and use <kbd>↑</kbd>/<kbd>↓</kbd> arrow keys to resize. Hold
    <kbd>Shift</kbd> for larger steps. <kbd>Enter</kbd> collapses/restores the pane.
  </p>
  <Example>
    <div role="none" style="height: 300px;">
      <ResizablePaneGroup direction="vertical">
        <ResizablePane
          defaultSize={40}
          minSize={10}
          style="padding: 12px; background: var(--sui-tertiary-background-color);"
        >
          Top pane
        </ResizablePane>
        <ResizableHandle aria-label="Top pane size" />
        <ResizablePane
          defaultSize={60}
          minSize={10}
          style="padding: 12px; background: var(--sui-secondary-background-color);"
        >
          Bottom pane
        </ResizablePane>
      </ResizablePaneGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Nested</h3>
  <Example>
    <div role="none" style="height: 300px;">
      <ResizablePaneGroup direction="horizontal">
        <ResizablePane
          defaultSize={30}
          minSize={15}
          style="padding: 12px; background: var(--sui-tertiary-background-color);"
        >
          Left
        </ResizablePane>
        <ResizableHandle aria-label="Left pane size" />
        <ResizablePane defaultSize={70} minSize={30}>
          <ResizablePaneGroup direction="vertical">
            <ResizablePane
              defaultSize={50}
              minSize={20}
              style="padding: 12px; background: var(--sui-secondary-background-color);"
            >
              Top Right
            </ResizablePane>
            <ResizableHandle aria-label="Top right pane size" />
            <ResizablePane
              defaultSize={50}
              minSize={20}
              style="padding: 12px; background: var(--sui-primary-background-color);"
            >
              Bottom Right
            </ResizablePane>
          </ResizablePaneGroup>
        </ResizablePane>
      </ResizablePaneGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Min/Max Constraints</h3>
  <Example>
    <div role="none" style="height: 200px;">
      <ResizablePaneGroup direction="horizontal">
        <ResizablePane
          defaultSize={50}
          minSize={20}
          maxSize={70}
          style="padding: 12px; background: var(--sui-tertiary-background-color);"
        >
          Min 20% · Max 70%
        </ResizablePane>
        <ResizableHandle aria-label="Left pane size" />
        <ResizablePane
          defaultSize={50}
          minSize={20}
          maxSize={80}
          style="padding: 12px; background: var(--sui-secondary-background-color);"
        >
          Min 20% · Max 80%
        </ResizablePane>
      </ResizablePaneGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Events</h3>
  <p>
    <code>ResizablePane</code> fires <code>onResize(detail)</code> with the pane's current size in
    percent.
    <code>ResizableHandle</code>
    fires <code>onResizeStart</code> and
    <code>onResizeEnd</code>.
  </p>
  <Example>
    <div role="none" style="height: 200px;">
      <ResizablePaneGroup
        direction="horizontal"
        onResize={({ sizes }) => log(`ResizablePaneGroup resize → [${sizes.join(', ')}]`)}
      >
        <ResizablePane
          defaultSize={50}
          minSize={20}
          style="padding: 12px; background: var(--sui-tertiary-background-color);"
          onResize={({ size }) => log(`ResizablePane 1 resize → ${size}%`)}
        >
          ResizablePane 1
        </ResizablePane>
        <ResizableHandle
          aria-label="ResizablePane 1 size"
          onResizeStart={() => log('Handle → resizeStart')}
          onResizeEnd={() => log('Handle → resizeEnd')}
        />
        <ResizablePane
          defaultSize={50}
          minSize={20}
          style="padding: 12px; background: var(--sui-secondary-background-color);"
          onResize={({ size }) => log(`ResizablePane 2 resize → ${size}%`)}
        >
          ResizablePane 2
        </ResizablePane>
      </ResizablePaneGroup>
    </div>
    <ul
      style="margin: 8px 0 0; padding: 0; list-style: none; font-size: var(--sui-font-size-small);"
    >
      {#each eventLog as entry}
        <li style="padding: 2px 0; color: var(--sui-secondary-foreground-color);">{entry}</li>
      {/each}
    </ul>
  </Example>
</section>

<section>
  <h3>Disabled Handle</h3>
  <Example>
    <div role="none" style="height: 200px;">
      <ResizablePaneGroup direction="horizontal">
        <ResizablePane
          defaultSize={50}
          style="padding: 12px; background: var(--sui-tertiary-background-color);"
        >
          Fixed pane
        </ResizablePane>
        <ResizableHandle disabled aria-label="Left pane size" />
        <ResizablePane
          defaultSize={50}
          style="padding: 12px; background: var(--sui-secondary-background-color);"
        >
          Fixed pane
        </ResizablePane>
      </ResizablePaneGroup>
    </div>
  </Example>
</section>
