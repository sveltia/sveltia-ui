import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CompositeWidget, createWidgetAttachment } from './composite-widget.svelte.js';

/**
 * Instances created so far.
 * @type {TestWidget[]}
 */
const instances = [];

/**
 * Widget that records what happens to it.
 */
class TestWidget extends CompositeWidget {
  /** @type {string[]} */
  calls = [];

  /**
   * Initialize a new instance.
   * @param {HTMLElement} parent Widget root.
   * @param {Record<string, any>} [params] Params.
   */
  constructor(parent, params) {
    super(parent);
    this.params = params;
    instances.push(this);
    this.listen('click', () => {
      this.calls.push('click');
    });
  }

  /** @override */
  setUp() {
    this.calls.push('setUp');
  }
}

describe('CompositeWidget', () => {
  /** @type {HTMLElement} */
  let parent;

  beforeEach(() => {
    vi.useFakeTimers();
    parent = document.createElement('div');
    document.body.appendChild(parent);
  });

  afterEach(() => {
    parent.remove();
    vi.useRealTimers();
  });

  it('dispatches the lifecycle events and activates once after a delay', async () => {
    const onInitializing = vi.fn();
    const onInitialized = vi.fn();

    parent.addEventListener('Initializing', onInitializing);
    parent.addEventListener('Initialized', onInitialized);

    const widget = new TestWidget(parent);

    expect(onInitializing).toHaveBeenCalledOnce();
    expect(widget.activated).toBe(false);
    await vi.advanceTimersByTimeAsync(150);
    expect(widget.activated).toBe(true);
    widget.activate();
    expect(widget.calls).toEqual(['setUp']);
    expect(onInitialized).toHaveBeenCalledOnce();
  });

  it('activates before handling an event that comes first', () => {
    const widget = new TestWidget(parent);

    parent.click();
    expect(widget.calls).toEqual(['setUp', 'click']);
  });

  it('stops listening and never activates once destroyed', async () => {
    const widget = new TestWidget(parent);

    widget.destroy();
    expect(widget.destroyed).toBe(true);
    parent.click();
    await vi.advanceTimersByTimeAsync(150);
    expect(widget.calls).toEqual([]);
    expect(widget.activated).toBe(false);
  });

  it('reads the disabled and read-only states from the root', () => {
    const widget = new TestWidget(parent);

    expect(widget.isDisabled).toBe(false);
    expect(widget.isReadOnly).toBe(false);
    parent.setAttribute('aria-disabled', 'true');
    parent.setAttribute('aria-readonly', 'true');
    expect(widget.isDisabled).toBe(true);
    expect(widget.isReadOnly).toBe(true);
    widget.destroy();
  });

  it('dispatches a `Change` event with the selected item detail', () => {
    const widget = new TestWidget(parent);
    const item = document.createElement('div');
    const onChange = vi.fn();

    item.dataset.value = 'apple';
    item.dataset.name = 'fruit';
    parent.addEventListener('Change', onChange);
    widget.dispatchChange(item);
    expect(onChange.mock.calls[0][0].detail).toMatchObject({ value: 'apple', name: 'fruit' });
    widget.destroy();
  });

  it('has no-op hooks by default', () => {
    const widget = new CompositeWidget(parent);

    expect(() => {
      widget.setUp();
      widget.onUpdate({});
    }).not.toThrow();
    widget.destroy();
  });
});

describe('createWidgetAttachment', () => {
  it('creates the widget with plain params and destroys it on clean-up', () => {
    const parent = document.createElement('div');
    const cleanup = createWidgetAttachment(TestWidget)({ foo: 1 })(parent);
    const created = instances.at(-1);

    expect(created?.params).toEqual({ foo: 1 });
    cleanup?.();
    expect(created?.destroyed).toBe(true);
  });
});
