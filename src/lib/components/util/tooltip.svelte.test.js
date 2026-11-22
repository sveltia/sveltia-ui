import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { html } from '../../test-utils/snippets.js';
import Button from '../button/button.svelte';

/**
 * Check whether the tooltip is shown.
 * @param {HTMLElement} tooltip Tooltip.
 * @returns {boolean} Result.
 */
const isShown = (tooltip) => tooltip.matches(':popover-open');

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
    const tooltip = /** @type {HTMLElement} */ (screen.container.querySelector('[role="tooltip"]'));

    expect(isShown(tooltip)).toBe(false);
    await userEvent.hover(button);
    await expect.poll(() => isShown(tooltip)).toBe(true);
    expect(tooltip.textContent?.trim()).toBe('Save the entry');
    expect(tooltip.getBoundingClientRect().top).toBeGreaterThan(
      button.element().getBoundingClientRect().bottom,
    );
    await userEvent.unhover(button);
    await expect.poll(() => isShown(tooltip)).toBe(false);
  });

  it('stays while the pointer moves onto it', async () => {
    const screen = await render(Button, { label: 'Save', tooltip: 'Save the entry' });
    const tooltip = /** @type {HTMLElement} */ (screen.container.querySelector('[role="tooltip"]'));

    await userEvent.hover(screen.getByRole('button'));
    await expect.poll(() => isShown(tooltip)).toBe(true);
    tooltip.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
    tooltip.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });
    expect(isShown(tooltip)).toBe(true);
  });

  it('ignores a touch, which would cover what the tap does', async () => {
    await movePointerAway();

    const screen = await render(Button, { label: 'Save', tooltip: 'Save the entry' });
    const tooltip = /** @type {HTMLElement} */ (screen.container.querySelector('[role="tooltip"]'));

    screen
      .getByRole('button')
      .element()
      .dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }));
    await new Promise((resolve) => {
      setTimeout(resolve, 700);
    });
    expect(isShown(tooltip)).toBe(false);
  });

  it('shows at once on keyboard focus, and the Escape key dismisses it', async () => {
    const screen = await render(Button, { label: 'Save', tooltip: 'Save the entry' });
    const button = screen.getByRole('button');
    const tooltip = /** @type {HTMLElement} */ (screen.container.querySelector('[role="tooltip"]'));

    await movePointerAway();
    await focusWithKeyboard(button.element());
    await expect.element(button).toHaveFocus();
    await expect.poll(() => isShown(tooltip)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isShown(tooltip)).toBe(false);
    // The focus stays on the button
    await expect.element(button).toHaveFocus();
    // Shown again once the focus comes back
    button.element().blur();
    await focusWithKeyboard(button.element());
    await expect.poll(() => isShown(tooltip)).toBe(true);
    button.element().blur();
    await expect.poll(() => isShown(tooltip)).toBe(false);
  });

  it('describes the button, keeping its other descriptions', async () => {
    const screen = await render(Button, {
      label: 'Save',
      tooltip: 'Save the entry',
      'aria-describedby': 'note',
    });

    const button = screen.getByRole('button').element();
    const { id } = /** @type {HTMLElement} */ (screen.container.querySelector('[role="tooltip"]'));

    expect(button.getAttribute('aria-describedby')).toBe(`note ${id}`);
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
    const tooltip = /** @type {HTMLElement} */ (screen.container.querySelector('[role="tooltip"]'));

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
    await expect.poll(() => isShown(tooltip)).toBe(true);
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
    const tooltip = /** @type {HTMLElement} */ (screen.container.querySelector('[role="tooltip"]'));

    await movePointerAway();
    await focusWithKeyboard(button);
    await expect.poll(() => isShown(tooltip)).toBe(true);
    expect(tooltip.getBoundingClientRect().left).toBeGreaterThan(
      button.getBoundingClientRect().right,
    );
    expect(tooltip.classList.contains('right')).toBe(true);
  });

  it('hides when the button is pressed, until the pointer comes back', async () => {
    await movePointerAway();

    const screen = await render(Button, { label: 'More', tooltip: 'More options' });
    const button = screen.getByRole('button');
    const tooltip = /** @type {HTMLElement} */ (screen.container.querySelector('[role="tooltip"]'));

    await userEvent.hover(button);
    await expect.poll(() => isShown(tooltip)).toBe(true);
    await button.click();
    await expect.poll(() => isShown(tooltip)).toBe(false);
    await movePointerAway();
    await userEvent.hover(button);
    await expect.poll(() => isShown(tooltip)).toBe(true);
  });

  it('uses up the Escape key that hides it, so a dialog around it stays open', async () => {
    const screen = await render(Button, { label: 'Save', tooltip: 'Save the entry' });
    const button = screen.getByRole('button').element();
    const tooltip = /** @type {HTMLElement} */ (screen.container.querySelector('[role="tooltip"]'));
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
    await expect.poll(() => isShown(tooltip)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isShown(tooltip)).toBe(false);
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
});
