import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import EmojiSuggestions from './emoji-suggestions.svelte';
import { parkPointer } from '../../test-utils/pointer.js';

/**
 * @import { EmojiAnchorRect, EmojiTrigger } from '$lib/typedefs';
 */

/** @type {EmojiAnchorRect} */
const rect = { top: 100, bottom: 120, left: 20, right: 60 };
/**
 * Get the suggestion list.
 * @returns {HTMLElement | null} Element.
 */
const getList = () => document.querySelector('.sui.emoji-suggestions');

/**
 * Render the component with a stubbed anchor.
 * @param {Partial<import('svelte').ComponentProps<typeof EmojiSuggestions>>} [props] Props.
 * @returns {Promise<{ screen: Awaited<ReturnType<typeof render<typeof EmojiSuggestions>>>,
 * onSelect: ReturnType<typeof vi.fn>, getAnchorRect: ReturnType<typeof vi.fn> }>} Rendered
 * component and the mocks.
 */
const renderList = async (props = {}) => {
  const onSelect = vi.fn();
  const getAnchorRect = vi.fn(() => rect);
  const screen = await render(EmojiSuggestions, { getAnchorRect, onSelect, ...props });

  return { screen, onSelect, getAnchorRect };
};

describe('EmojiSuggestions', () => {
  beforeEach(async () => {
    // The highlight follows the pointer, so keep it away from where the list appears
    await parkPointer();
  });

  it('renders nothing until a shortcode is fed in', async () => {
    const { screen } = await renderList();

    expect(getList()).toBeNull();
    expect(screen.component.isOpen()).toBe(false);
  });

  it('lists the matching emojis in a popover at the anchor', async () => {
    const { screen, getAnchorRect } = await renderList();
    /** @type {EmojiTrigger} */
    const trigger = { id: '1', query: 'smi' };

    screen.component.update(trigger);
    expect(screen.component.isOpen()).toBe(true);
    expect(getAnchorRect).toHaveBeenCalledWith(trigger);
    await vi.waitFor(() => {
      expect(getList()).not.toBeNull();
    });

    const list = /** @type {HTMLElement} */ (getList());

    expect(list.getAttribute('popover')).toBe('manual');
    expect(list.matches(':popover-open')).toBe(true);
    expect(list.style.top).toBe('124px');
    expect(list.style.left).toBe('20px');
    expect(list.style.maxHeight).not.toBe('');

    const options = list.querySelectorAll('[role="option"]');

    expect(options.length).toBeGreaterThan(1);
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    expect(options[0].id).toBe(`${list.id}-option-0`);
    expect(options[0].querySelector('.emoji')?.textContent).toBeTruthy();
    expect(options[0].querySelector('.name')?.textContent).toMatch(/^:.+:$/);
  });

  it('stays hidden while the anchor cannot be located', async () => {
    const { screen } = await renderList({
      /**
       * Fail to locate the anchor.
       * @returns {undefined} Nothing.
       */
      getAnchorRect: () => undefined,
    });

    screen.component.update({ id: '1', query: 'smi' });
    expect(screen.component.isOpen()).toBe(true);
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(getList()).toBeNull();
  });

  it('does nothing when moving or selecting while closed', async () => {
    const { screen, onSelect } = await renderList();

    screen.component.moveSelection(1);
    screen.component.selectHighlighted();
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.component.isOpen()).toBe(false);
  });

  it('closes without matches, and without a shortcode', async () => {
    const { screen } = await renderList();

    screen.component.update({ id: '1', query: 'zzzzzz' });
    expect(screen.component.isOpen()).toBe(false);
    screen.component.update({ id: '1', query: 'smi' });
    expect(screen.component.isOpen()).toBe(true);
    screen.component.update(undefined);
    expect(screen.component.isOpen()).toBe(false);
    await vi.waitFor(() => {
      expect(getList()).toBeNull();
    });
  });

  it('keeps the highlight when the caret moves without the query changing', async () => {
    const { screen } = await renderList();

    screen.component.update({ id: '1', query: 'smi' });
    screen.component.moveSelection(2);
    screen.component.update({ id: '1', query: 'smi' });
    await vi.waitFor(() => {
      expect(getList()?.querySelectorAll('[role="option"]')[2].getAttribute('aria-selected')).toBe(
        'true',
      );
    });
    // A different query resets it
    screen.component.update({ id: '1', query: 'smile' });
    await vi.waitFor(() => {
      expect(getList()?.querySelectorAll('[role="option"]')[0].getAttribute('aria-selected')).toBe(
        'true',
      );
    });
  });

  it('moves the highlight with wrapping, and selects the highlighted emoji', async () => {
    const { screen, onSelect } = await renderList();
    /** @type {EmojiTrigger} */
    const trigger = { id: '1', query: 'smi' };

    screen.component.update(trigger);
    await vi.waitFor(() => {
      expect(getList()).not.toBeNull();
    });

    const count = getList()?.querySelectorAll('[role="option"]').length ?? 0;

    const second = getList()
      ?.querySelectorAll('[role="option"]')[1]
      .querySelector('.emoji')?.textContent;

    screen.component.moveSelection(-1);
    await vi.waitFor(() => {
      expect(
        getList()?.querySelectorAll('[role="option"]')[count - 1].getAttribute('aria-selected'),
      ).toBe('true');
    });
    screen.component.moveSelection(2);
    screen.component.selectHighlighted();
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect.mock.calls[0][0].emoji).toBe(second);
    expect(onSelect.mock.calls[0][1]).toEqual(trigger);
    expect(screen.component.isOpen()).toBe(false);
  });

  it('handles the keys that drive the list, and leaves the others alone', async () => {
    const { screen, onSelect } = await renderList();

    /**
     * Make a keydown event.
     * @param {string} key Key.
     * @param {KeyboardEventInit} [init] Extra options.
     * @returns {KeyboardEvent} Event.
     */
    const keydown = (key, init = {}) =>
      new KeyboardEvent('keydown', { key, cancelable: true, ...init });

    // Closed: nothing is consumed
    expect(screen.component.handleKeyDown(keydown('ArrowDown'))).toBe(false);

    screen.component.update({ id: '1', query: 'smi' });

    const down = keydown('ArrowDown');

    expect(screen.component.handleKeyDown(down)).toBe(true);
    expect(down.defaultPrevented).toBe(true);
    await vi.waitFor(() => {
      expect(getList()?.querySelectorAll('[role="option"]')[1].getAttribute('aria-selected')).toBe(
        'true',
      );
    });
    expect(screen.component.handleKeyDown(keydown('ArrowUp'))).toBe(true);
    expect(screen.component.handleKeyDown(keydown('a'))).toBe(false);
    expect(screen.component.handleKeyDown(keydown('Enter', { ctrlKey: true }))).toBe(false);
    expect(screen.component.handleKeyDown(keydown('Enter', { shiftKey: true }))).toBe(false);
    expect(screen.component.handleKeyDown(keydown('Tab'))).toBe(true);
    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.component.isOpen()).toBe(false);
  });

  it('stays dismissed for the same shortcode after Escape', async () => {
    const { screen } = await renderList();

    screen.component.update({ id: '1', query: 'smi' });
    expect(screen.component.handleKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }))).toBe(
      true,
    );
    expect(screen.component.isOpen()).toBe(false);
    screen.component.update({ id: '1', query: 'smile' });
    expect(screen.component.isOpen()).toBe(false);
    screen.component.update({ id: '2', query: 'smile' });
    expect(screen.component.isOpen()).toBe(true);
  });

  it('labels the owner element with the highlighted suggestion', async () => {
    const owner = document.createElement('input');

    document.body.appendChild(owner);

    const { screen } = await renderList({ ariaOwner: owner });

    expect(owner.getAttribute('aria-autocomplete')).toBe('list');
    expect(owner.getAttribute('aria-haspopup')).toBe('listbox');
    expect(owner.hasAttribute('aria-controls')).toBe(false);

    screen.component.update({ id: '1', query: 'smi' });
    await vi.waitFor(() => {
      expect(owner.getAttribute('aria-controls')).toBe(getList()?.id);
    });
    expect(owner.getAttribute('aria-activedescendant')).toBe(`${getList()?.id}-option-0`);
    screen.component.moveSelection(1);
    await vi.waitFor(() => {
      expect(owner.getAttribute('aria-activedescendant')).toBe(`${getList()?.id}-option-1`);
    });
    screen.component.close();
    await vi.waitFor(() => {
      expect(owner.hasAttribute('aria-controls')).toBe(false);
    });
    expect(owner.hasAttribute('aria-activedescendant')).toBe(false);

    await screen.unmount();
    expect(owner.hasAttribute('aria-autocomplete')).toBe(false);
    expect(owner.hasAttribute('aria-haspopup')).toBe(false);
  });

  it('follows the anchor when the window is resized, and closes on a press elsewhere', async () => {
    const { screen, getAnchorRect } = await renderList();

    screen.component.update({ id: '1', query: 'smi' });
    getAnchorRect.mockReturnValue({ ...rect, top: 300, bottom: 320 });
    window.dispatchEvent(new Event('resize'));
    await vi.waitFor(() => {
      expect(getList()?.style.top).toBe('324px');
    });

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(screen.component.isOpen()).toBe(false);
  });

  it('flips above the caret near the bottom of the viewport', async () => {
    const { screen } = await renderList({
      /**
       * Anchor near the bottom of the viewport.
       * @returns {EmojiAnchorRect} Bounds.
       */
      getAnchorRect: () => ({
        top: window.innerHeight - 30,
        bottom: window.innerHeight - 10,
        left: 10,
        right: 50,
      }),
    });

    screen.component.update({ id: '1', query: 'smi' });
    await vi.waitFor(() => {
      expect(getList()?.style.bottom).toBe('34px');
    });
    expect(getList()?.style.top).toBe('');
  });
});
