import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import SelectTags from './select-tags.svelte';
import { setRTL } from '../../test-utils/locale.js';

/**
 * @import { ComponentProps } from 'svelte';
 */

const options = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana', searchValue: 'yellow' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
];

/**
 * Get the labels of the selected tags in order.
 * @param {HTMLElement} container Container.
 * @returns {string[]} Labels.
 */
const getTags = (container) =>
  [...container.querySelectorAll('[role="gridcell"].label')].map(
    (tag) => tag.textContent?.trim() ?? '',
  );

describe('SelectTags', () => {
  afterEach(() => {
    setRTL(false);
  });

  it('renders the selected values as tags with remove buttons, and a select for the rest', async () => {
    const screen = await render(SelectTags, {
      options,
      values: ['banana', 'apple'],
      class: 'custom',
    });

    await expect.element(screen.getByRole('grid', { name: 'Selected Options' })).toBeVisible();
    expect(screen.container.querySelector('.sui.select-tags')?.classList.contains('custom')).toBe(
      true,
    );
    expect(getTags(screen.container)).toEqual(['Banana', 'Apple']);
    await expect.element(screen.getByRole('button', { name: /Remove.*Banana/ })).toBeVisible();
    await expect.element(screen.getByRole('combobox')).toBeVisible();
    screen.container.querySelectorAll('[role="gridcell"].label').forEach((tag) => {
      expect(tag.getAttribute('tabindex')).toBe('0');
      expect(/** @type {HTMLElement} */ (tag.parentElement).draggable).toBe(true);
    });
  });

  it('shows a value that has no matching option, without a remove button', async () => {
    const screen = await render(SelectTags, { options, values: ['unknown'] });

    expect(getTags(screen.container)).toEqual(['unknown']);
    expect(screen.container.querySelector('[role="grid"] .sui.button')).toBeNull();
  });

  it('adds a value picked from the select', async () => {
    const onAddValue = vi.fn();
    /** @type {ComponentProps<typeof SelectTags>} */
    const props = $state({ options, values: ['apple'], onAddValue });
    const screen = await render(SelectTags, props);

    await screen.getByRole('combobox').click();
    // The already selected option is left out
    await vi.waitFor(() => {
      expect(document.querySelectorAll('dialog.popup [role="option"]')).toHaveLength(3);
    });
    await screen.getByRole('option', { name: 'Cherry' }).click();
    await vi.waitFor(() => {
      expect(props.values).toEqual(['apple', 'cherry']);
    });
    expect(onAddValue).toHaveBeenCalledOnce();
    expect(onAddValue.mock.calls[0][0].detail).toEqual({ value: 'cherry' });
    expect(getTags(screen.container)).toEqual(['Apple', 'Cherry']);
  });

  it('removes a value with its button', async () => {
    const onRemoveValue = vi.fn();
    /** @type {ComponentProps<typeof SelectTags>} */
    const props = $state({ options, values: ['apple', 'banana'], onRemoveValue });
    const screen = await render(SelectTags, props);

    await screen.getByRole('button', { name: /Remove.*Apple/ }).click();
    expect(props.values).toEqual(['banana']);
    expect(onRemoveValue).toHaveBeenCalledOnce();
    expect(onRemoveValue.mock.calls[0][0].detail).toEqual({ value: 'apple' });
    await vi.waitFor(() => {
      expect(getTags(screen.container)).toEqual(['Banana']);
    });
  });

  it('hides the select once the maximum or every option is selected', async () => {
    /** @type {ComponentProps<typeof SelectTags>} */
    const props = $state({ options, values: ['apple'], max: 2 });
    const screen = await render(SelectTags, props);

    expect(screen.container.querySelector('[role="combobox"]')).not.toBeNull();
    props.values = ['apple', 'banana'];
    await vi.waitFor(() => {
      expect(screen.container.querySelector('[role="combobox"]')).toBeNull();
    });

    props.max = undefined;
    await vi.waitFor(() => {
      expect(screen.container.querySelector('[role="combobox"]')).not.toBeNull();
    });
    props.values = options.map(({ value }) => value);
    await vi.waitFor(() => {
      expect(screen.container.querySelector('[role="combobox"]')).toBeNull();
    });
  });

  it('reorders the tags with the keyboard', async () => {
    const onReorder = vi.fn();
    /** @type {ComponentProps<typeof SelectTags>} */
    const props = $state({ options, values: ['apple', 'banana', 'cherry'], onReorder });
    const screen = await render(SelectTags, props);
    const apple = /** @type {HTMLElement} */ (screen.getByText('Apple').element());

    apple.focus();
    await userEvent.keyboard('{ArrowRight}');
    await vi.waitFor(() => {
      expect(props.values).toEqual(['banana', 'apple', 'cherry']);
    });
    expect(onReorder).toHaveBeenCalledOnce();
    expect(onReorder.mock.calls[0][0].detail).toEqual({ values: ['banana', 'apple', 'cherry'] });
    // The moved tag keeps the focus
    await vi.waitFor(() => {
      expect(document.activeElement?.textContent?.trim()).toBe('Apple');
    });

    await userEvent.keyboard('{End}');
    await vi.waitFor(() => {
      expect(props.values).toEqual(['banana', 'cherry', 'apple']);
    });
    await userEvent.keyboard('{Home}');
    await vi.waitFor(() => {
      expect(props.values).toEqual(['apple', 'banana', 'cherry']);
    });
    // Already at the start, so nothing happens
    await userEvent.keyboard('{ArrowLeft}');
    expect(onReorder).toHaveBeenCalledTimes(3);
  });

  it('reorders the tags by drag and drop', async () => {
    /** @type {ComponentProps<typeof SelectTags>} */
    const props = $state({ options, values: ['apple', 'banana', 'cherry'] });
    const screen = await render(SelectTags, props);

    const wrappers = /** @type {HTMLElement[]} */ ([
      ...screen.container.querySelectorAll('[draggable]'),
    ]);

    const [apple, , cherry] = wrappers;
    const transfer = new DataTransfer();

    apple.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: transfer }));
    await vi.waitFor(() => {
      expect(apple.classList.contains('drag-source')).toBe(true);
    });
    expect(transfer.getData('text/plain')).toBe('Apple');

    // Drop on the second half of the last tag, i.e. after it
    const rect = cherry.getBoundingClientRect();

    cherry.dispatchEvent(
      new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        clientX: rect.right - 1,
        dataTransfer: transfer,
      }),
    );
    await vi.waitFor(() => {
      expect(cherry.classList.contains('drop-after')).toBe(true);
    });
    cherry.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => {
      expect(props.values).toEqual(['banana', 'cherry', 'apple']);
    });
    apple.dispatchEvent(new DragEvent('dragend', { bubbles: true }));
    await vi.waitFor(() => {
      expect(screen.container.querySelector('.drag-source')).toBeNull();
    });
  });

  it('marks the drop position before a tag, and ignores a drop in place', async () => {
    /** @type {ComponentProps<typeof SelectTags>} */
    const props = $state({ options, values: ['apple', 'banana', 'cherry'] });
    const screen = await render(SelectTags, props);

    const [apple, banana, cherry] = /** @type {HTMLElement[]} */ ([
      ...screen.container.querySelectorAll('[draggable]'),
    ]);

    // A drop without a drag in progress does nothing
    banana.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true }));
    expect(props.values).toEqual(['apple', 'banana', 'cherry']);

    // Events without a data transfer, as some browsers send, are fine
    cherry.dispatchEvent(new DragEvent('dragstart', { bubbles: true }));

    const rect = apple.getBoundingClientRect();

    apple.dispatchEvent(
      new DragEvent('dragover', { bubbles: true, cancelable: true, clientX: rect.left + 1 }),
    );
    await vi.waitFor(() => {
      expect(apple.classList.contains('drop-before')).toBe(true);
    });
    apple.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => {
      expect(props.values).toEqual(['cherry', 'apple', 'banana']);
    });

    // Dropping a tag right where it already is leaves the order alone
    const [first] = /** @type {HTMLElement[]} */ ([
      ...screen.container.querySelectorAll('[draggable]'),
    ]);

    const firstRect = first.getBoundingClientRect();

    first.dispatchEvent(new DragEvent('dragstart', { bubbles: true }));
    first.dispatchEvent(
      new DragEvent('dragover', { bubbles: true, cancelable: true, clientX: firstRect.left + 1 }),
    );
    first.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(props.values).toEqual(['cherry', 'apple', 'banana']);
  });

  it('mirrors the drop position and the arrow keys in a right-to-left locale', async () => {
    setRTL(true);

    /** @type {ComponentProps<typeof SelectTags>} */
    const props = $state({ options, values: ['apple', 'banana'] });
    const screen = await render(SelectTags, props);

    const [apple, banana] = /** @type {HTMLElement[]} */ ([
      ...screen.container.querySelectorAll('[draggable]'),
    ]);

    // The list runs from right to left, so the left half of a tag is “after” it
    const rect = banana.getBoundingClientRect();

    apple.dispatchEvent(new DragEvent('dragstart', { bubbles: true }));
    banana.dispatchEvent(
      new DragEvent('dragover', { bubbles: true, cancelable: true, clientX: rect.left + 1 }),
    );
    await vi.waitFor(() => {
      expect(banana.classList.contains('drop-after')).toBe(true);
    });
    banana.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => {
      expect(props.values).toEqual(['banana', 'apple']);
    });

    /** @type {HTMLElement} */ (screen.getByText('Apple').element()).focus();
    await userEvent.keyboard('{ArrowRight}');
    await vi.waitFor(() => {
      expect(props.values).toEqual(['apple', 'banana']);
    });
  });

  it('disables the tags and the select while disabled or read-only', async () => {
    const screen = await render(SelectTags, { options, values: ['apple'], readonly: true });
    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.select-tags'));

    expect(wrapper.classList.contains('disabled')).toBe(true);
    expect(wrapper.querySelector('[role="gridcell"].label')?.hasAttribute('tabindex')).toBe(false);
    expect(/** @type {HTMLElement} */ (wrapper.querySelector('[draggable]')).draggable).toBe(false);
    expect(
      /** @type {HTMLButtonElement} */ (wrapper.querySelector('[role="grid"] .sui.button'))
        .disabled,
    ).toBe(true);
    expect(wrapper.querySelector('[role="combobox"]')?.getAttribute('aria-disabled')).toBe('true');
  });

  it('can be hidden', async () => {
    const screen = await render(SelectTags, { options, hidden: true });

    expect(
      /** @type {HTMLElement} */ (screen.container.querySelector('.sui.select-tags')).hidden,
    ).toBe(true);
  });
});
