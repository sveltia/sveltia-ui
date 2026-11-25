import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { html } from '../../test-utils/snippets.js';
import Button from '../button/button.svelte';
import TooltipFixture from './tooltip-fixture.test.svelte';
import Tooltip from './tooltip.svelte';

/**
 * Get the tooltip, which is only rendered once its anchor is hovered or focused, or it’s forced
 * open.
 * @param {HTMLElement} container Container.
 * @returns {HTMLElement | null} Tooltip.
 */
const getTooltip = (container) => container.querySelector('[role="tooltip"]');
/**
 * Check whether the tooltip is shown.
 * @param {HTMLElement} container Container.
 * @returns {boolean} Result.
 */
const isShown = (container) => !!getTooltip(container)?.matches(':popover-open');

/**
 * Wait for a while.
 * @param {number} ms Milliseconds.
 * @returns {Promise<void>} Promise.
 */
const wait = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Move the real pointer away from where the previous test left it, which can be over the button.
 */
const movePointerAway = async () => {
  const spacer = document.createElement('div');

  spacer.style.cssText = 'position: fixed; right: 0; bottom: 0; width: 10px; height: 10px;';
  document.body.appendChild(spacer);
  await userEvent.hover(spacer);
  spacer.remove();
};

/**
 * Focus an element the way the keyboard would, which a programmatic focus counts as right after a
 * key press. A modifier key alone doesn’t count in Firefox, and WebKit doesn’t move the focus to a
 * button with the Tab key by default, so Tab is pressed and the element focused afterwards.
 * @param {HTMLElement | SVGElement} element Element.
 */
const focusWithKeyboard = async (element) => {
  await userEvent.keyboard('{Tab}');
  element.focus();
};

describe('Tooltip', () => {
  it('shows on hover, under the button, and hides when the pointer leaves', async () => {
    const screen = await render(Button, { label: 'Save', tooltip: 'Save the entry' });
    const button = screen.getByRole('button', { name: 'Save' });

    expect(isShown(screen.container)).toBe(false);
    await userEvent.hover(button);
    await expect.poll(() => isShown(screen.container)).toBe(true);

    const tooltip = /** @type {HTMLElement} */ (getTooltip(screen.container));

    expect(tooltip.textContent?.trim()).toBe('Save the entry');
    expect(tooltip.getBoundingClientRect().top).toBeGreaterThan(
      button.element().getBoundingClientRect().bottom,
    );
    await userEvent.unhover(button);
    await expect.poll(() => isShown(screen.container)).toBe(false);
  });

  it('stays while the pointer moves onto it', async () => {
    const screen = await render(Button, { label: 'Save', tooltip: 'Save the entry' });

    await userEvent.hover(screen.getByRole('button'));
    await expect.poll(() => isShown(screen.container)).toBe(true);

    const tooltip = /** @type {HTMLElement} */ (getTooltip(screen.container));

    tooltip.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
    tooltip.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });
    expect(isShown(screen.container)).toBe(true);
  });

  it('ignores a touch, which would cover what the tap does', async () => {
    await movePointerAway();

    const screen = await render(Button, { label: 'Save', tooltip: 'Save the entry' });

    screen
      .getByRole('button')
      .element()
      .dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }));
    await new Promise((resolve) => {
      setTimeout(resolve, 700);
    });
    expect(isShown(screen.container)).toBe(false);
  });

  it('shows at once on keyboard focus, and the Escape key dismisses it', async () => {
    const screen = await render(Button, { label: 'Save', tooltip: 'Save the entry' });
    const button = screen.getByRole('button');

    await movePointerAway();
    await focusWithKeyboard(button.element());
    await expect.element(button).toHaveFocus();
    await expect.poll(() => isShown(screen.container)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isShown(screen.container)).toBe(false);
    // The focus stays on the button
    await expect.element(button).toHaveFocus();
    // Shown again once the focus comes back
    button.element().blur();
    await focusWithKeyboard(button.element());
    await expect.poll(() => isShown(screen.container)).toBe(true);
    button.element().blur();
    await expect.poll(() => isShown(screen.container)).toBe(false);
  });

  it('lets a block remove its button while it has the focus', async () => {
    const props = $state({ labels: ['Save', 'Delete'] });
    /** @type {string[]} */
    const errors = [];

    /**
     * Collect an uncaught error, which an event listener throwing doesn’t pass on to the test.
     * @param {ErrorEvent} event `error` event.
     */
    const onError = (event) => {
      errors.push(event.message);
    };

    window.addEventListener('error', onError);

    try {
      const screen = await render(TooltipFixture, props);
      const button = screen.getByRole('button', { name: 'Save' });

      button.element().focus();
      await expect.element(button).toHaveFocus();
      props.labels = ['Delete'];
      await expect.element(button).not.toBeInTheDocument();
      expect(errors).toEqual([]);
    } finally {
      window.removeEventListener('error', onError);
    }
  });

  it('describes the button, keeping its other descriptions', async () => {
    const screen = await render(Button, {
      label: 'Save',
      tooltip: 'Save the entry',
      'aria-describedby': 'note',
    });

    const button = screen.getByRole('button').element();
    const id = button.getAttribute('aria-describedby')?.split(' ')[1];

    expect(id).toBeTruthy();
    // Before the tooltip is used, a hidden element holds the description
    expect(document.getElementById(String(id))?.textContent).toBe('Save the entry');
    await expect.element(screen.getByRole('button')).toHaveAccessibleDescription('Save the entry');
    // The tooltip takes its place, under the same ID
    await focusWithKeyboard(button);
    await expect.poll(() => isShown(screen.container)).toBe(true);
    expect(getTooltip(screen.container)?.id).toBe(id);
    expect(button.getAttribute('aria-describedby')).toBe(`note ${id}`);
    await expect.element(screen.getByRole('button')).toHaveAccessibleDescription('Save the entry');
    screen.unmount();
    expect(button.getAttribute('aria-describedby')).toBe('note');
  });

  it('doesn’t describe an icon button with its own label again', async () => {
    const screen = await render(Button, {
      iconic: true,
      'aria-label': 'Delete',
      tooltip: 'Delete',
    });

    const button = screen.getByRole('button', { name: 'Delete' }).element();

    expect(button.hasAttribute('aria-describedby')).toBe(false);
    screen.unmount();
    expect(button.hasAttribute('aria-describedby')).toBe(false);
  });

  it('isn’t rendered without a text', async () => {
    const screen = await render(Button, { label: 'Save' });

    expect(screen.container.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('stays centred on the button when its text changes', async () => {
    /** @type {import('svelte').ComponentProps<typeof Button>} */
    const props = $state({ iconic: true, 'aria-label': 'Copy', tooltip: 'Copy the password' });
    // Away from the page’s edge, where the tooltip would be moved to stay on screen
    const target = document.createElement('div');

    target.style.paddingInlineStart = '300px';
    document.body.appendChild(target);

    const screen = await render(Button, { props, target });
    const button = screen.getByRole('button').element();

    /**
     * Get the horizontal centre of an element.
     * @param {HTMLElement | SVGElement} element Element.
     * @returns {number} Centre.
     */
    const getCentre = (element) => {
      const { left, width } = element.getBoundingClientRect();

      return left + width / 2;
    };

    await userEvent.hover(button);
    await expect.poll(() => isShown(screen.container)).toBe(true);

    const tooltip = /** @type {HTMLElement} */ (getTooltip(screen.container));

    expect(getCentre(tooltip)).toBeCloseTo(getCentre(button), 0);
    props.tooltip = 'Copied';
    await expect.poll(() => tooltip.textContent?.trim()).toBe('Copied');
    await expect.poll(() => Math.round(getCentre(tooltip))).toBe(Math.round(getCentre(button)));
  });

  it('shows on the side it’s given', async () => {
    // Away from the top and start of the page, so the given side has room in the narrow viewport
    const target = document.createElement('div');

    target.style.padding = '100px 40px';
    document.body.appendChild(target);

    const screen = await render(Button, {
      props: { label: 'Save', tooltip: 'Save it', tooltipPosition: 'right' },
      target,
    });

    const button = screen.getByRole('button').element();

    await movePointerAway();
    await focusWithKeyboard(button);
    await expect.poll(() => isShown(screen.container)).toBe(true);

    const tooltip = /** @type {HTMLElement} */ (getTooltip(screen.container));

    expect(tooltip.getBoundingClientRect().left).toBeGreaterThan(
      button.getBoundingClientRect().right,
    );
    expect(tooltip.classList.contains('right')).toBe(true);
  });

  it('moves while shown when its side changes', async () => {
    const target = document.createElement('div');

    target.style.padding = '100px 40px';
    document.body.appendChild(target);

    /** @type {import('svelte').ComponentProps<typeof Button>} */
    const props = $state({ label: 'Save', tooltip: 'Save it', tooltipPosition: 'right' });
    const screen = await render(Button, { props, target });
    const button = screen.getByRole('button').element();

    await movePointerAway();
    await focusWithKeyboard(button);
    await expect.poll(() => getTooltip(screen.container)?.classList.contains('right')).toBe(true);
    props.tooltipPosition = 'top';
    await expect.poll(() => getTooltip(screen.container)?.classList.contains('top')).toBe(true);
    expect(isShown(screen.container)).toBe(true);
  });

  it('hides when the button is pressed, until the pointer comes back', async () => {
    await movePointerAway();

    const screen = await render(Button, { label: 'More', tooltip: 'More options' });
    const button = screen.getByRole('button');

    await userEvent.hover(button);
    await expect.poll(() => isShown(screen.container)).toBe(true);
    await button.click();
    await expect.poll(() => isShown(screen.container)).toBe(false);
    await movePointerAway();
    await userEvent.hover(button);
    await expect.poll(() => isShown(screen.container)).toBe(true);
  });

  it('uses up the Escape key that hides it, so a dialog around it stays open', async () => {
    const screen = await render(Button, { label: 'Save', tooltip: 'Save the entry' });
    const button = screen.getByRole('button').element();
    /** @type {KeyboardEvent[]} */
    const reached = [];

    /**
     * Record the key presses that reach the document, as a dialog would see them.
     * @param {KeyboardEvent} event `keydown` event.
     */
    const listener = (event) => {
      reached.push(event);
    };

    document.addEventListener('keydown', listener);
    await movePointerAway();
    await focusWithKeyboard(button);
    await expect.poll(() => isShown(screen.container)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isShown(screen.container)).toBe(false);
    expect(reached.filter(({ key }) => key === 'Escape')).toHaveLength(0);
    // The next press goes through
    await userEvent.keyboard('{Escape}');
    expect(reached.filter(({ key }) => key === 'Escape')).toHaveLength(1);
    document.removeEventListener('keydown', listener);
  });

  it('doesn’t describe a labelled button with an icon by repeating its label', async () => {
    const screen = await render(Button, {
      label: 'Save',
      tooltip: 'Save',
      startIcon: html('<span class="icon" aria-hidden="true">save</span>'),
    });

    expect(screen.getByRole('button').element().hasAttribute('aria-describedby')).toBe(false);
  });

  describe('lazy activation', () => {
    it('renders no popover until the pointer rests on the button', async () => {
      await movePointerAway();

      const screen = await render(Button, { label: 'Save', tooltip: 'Save the entry' });
      const button = screen.getByRole('button');

      expect(getTooltip(screen.container)).toBeNull();
      expect(screen.container.querySelector('[popover]')).toBeNull();
      await userEvent.hover(button);
      // Rendered at once, but shown only after the usual delay
      await expect.poll(() => getTooltip(screen.container)).not.toBeNull();
      expect(isShown(screen.container)).toBe(false);
      await expect.poll(() => isShown(screen.container)).toBe(true);
      expect(getTooltip(screen.container)?.textContent?.trim()).toBe('Save the entry');
      // It keeps following the pointer from then on
      await userEvent.unhover(button);
      await expect.poll(() => isShown(screen.container)).toBe(false);
      await userEvent.hover(button);
      await expect.poll(() => isShown(screen.container)).toBe(true);
    });

    it('renders nothing for a button it doesn’t describe', async () => {
      const screen = await render(Button, {
        iconic: true,
        'aria-label': 'Delete',
        tooltip: 'Delete',
      });

      expect(screen.container.querySelector('button + *')).toBeNull();
    });

    it('shows at once on the first keyboard focus', async () => {
      await movePointerAway();

      const screen = await render(Button, { label: 'Save', tooltip: 'Save the entry' });
      const button = screen.getByRole('button');

      expect(getTooltip(screen.container)).toBeNull();
      await focusWithKeyboard(button.element());
      await expect.element(button).toHaveFocus();
      await expect.poll(() => isShown(screen.container)).toBe(true);
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => isShown(screen.container)).toBe(false);
      await expect.element(button).toHaveFocus();
    });

    it('stays hidden when it’s first used with a click', async () => {
      await movePointerAway();

      const screen = await render(Button, { label: 'Save', tooltip: 'Save the entry' });

      // The click wakes it up, and pressing the button dismisses it, as it would cover a menu
      await screen.getByRole('button').click();
      await expect.poll(() => getTooltip(screen.container)).not.toBeNull();
      await wait(700);
      expect(isShown(screen.container)).toBe(false);
    });

    it('isn’t woken up by a touch', async () => {
      await movePointerAway();

      const screen = await render(Button, { label: 'Save', tooltip: 'Save the entry' });
      const button = screen.getByRole('button');

      button.element().dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }));
      await wait(100);
      expect(getTooltip(screen.container)).toBeNull();
      // Nor shown by one once it’s awake
      await focusWithKeyboard(button.element());
      await expect.poll(() => isShown(screen.container)).toBe(true);
      button.element().blur();
      await expect.poll(() => isShown(screen.container)).toBe(false);
      button.element().dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }));
      await wait(700);
      expect(isShown(screen.container)).toBe(false);
    });

    it('shows at once when forced open, without any interaction', async () => {
      await movePointerAway();

      const anchor = document.createElement('button');

      anchor.textContent = 'Copy';
      document.body.appendChild(anchor);

      /** @type {import('svelte').ComponentProps<typeof Tooltip>} */
      const props = $state({ anchor, text: 'Copied', open: true });

      try {
        const screen = await render(Tooltip, { props });

        await expect.poll(() => isShown(screen.container)).toBe(true);
        expect(getTooltip(screen.container)?.textContent?.trim()).toBe('Copied');
        // Gone again once it’s no longer forced open, as it was never used
        props.open = false;
        await expect.poll(() => getTooltip(screen.container)).toBeNull();
        // Still woken up by the pointer afterwards
        props.text = 'Copy the text';
        await userEvent.hover(anchor);
        await expect.poll(() => isShown(screen.container)).toBe(true);
        expect(getTooltip(screen.container)?.textContent?.trim()).toBe('Copy the text');
      } finally {
        anchor.remove();
      }
    });
  });
});
