import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import Slider from './slider.svelte';
import { setRTL } from '../../test-utils/locale.js';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * Render a slider in a wrapper with a known width, so the track geometry is predictable.
 * @param {ComponentProps<typeof Slider>} props Props.
 * @returns {Promise<Awaited<ReturnType<typeof render<typeof Slider>>>>} Rendered slider.
 */
const renderSlider = async (props) => {
  const wrapper = document.createElement('div');

  wrapper.style.width = '400px';
  document.body.appendChild(wrapper);

  return render(Slider, { props, target: wrapper });
};

/**
 * Wait until the slider has measured its track.
 * @param {HTMLElement} container Container.
 */
const waitForInit = async (container) => {
  await vi.waitFor(() => {
    expect(
      /** @type {HTMLElement} */ (container.querySelector('.base')).clientWidth,
    ).toBeGreaterThan(0);
    expect(container.querySelector('.slider-bar')?.getAttribute('style')).toContain('width');
  });
};

describe('Slider', () => {
  afterEach(() => {
    setRTL(false);
  });

  it('renders a slider with the value and range', async () => {
    const screen = await renderSlider({
      value: 40,
      min: 0,
      max: 100,
      sliderLabel: 'Volume',
      class: 'custom',
    });

    const slider = screen.getByRole('slider', { name: 'Volume' });

    await expect.element(slider).toHaveAttribute('aria-valuenow', '40');
    await expect.element(slider).toHaveAttribute('aria-valuemin', '0');
    await expect.element(slider).toHaveAttribute('aria-valuemax', '100');
    await expect.element(slider).toHaveAttribute('tabindex', '0');
    expect(screen.container.querySelector('.sui.slider')?.classList.contains('custom')).toBe(true);
    await waitForInit(screen.container);

    const barWidth = /** @type {HTMLElement} */ (screen.container.querySelector('.base'))
      .clientWidth;

    // The thumb sits 40% along the track, and the bar is filled up to it
    expect(/** @type {HTMLElement} */ (slider.element()).style.insetInlineStart).toBe(
      `${barWidth * 0.4}px`,
    );
    expect(
      /** @type {HTMLElement} */ (screen.container.querySelector('.slider-bar')).style.width,
    ).toBe(`${barWidth * 0.4}px`);
  });

  it('reflects the state props', async () => {
    const screen = await renderSlider({
      hidden: true,
      disabled: true,
      readonly: true,
      invalid: true,
    });

    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.slider'));
    const slider = /** @type {HTMLElement} */ (wrapper.querySelector('[role="slider"]'));

    expect(wrapper.hidden).toBe(true);
    expect(wrapper.classList.contains('disabled')).toBe(true);
    expect(wrapper.classList.contains('readonly')).toBe(true);
    expect(wrapper.classList.contains('invalid')).toBe(true);
    expect(slider.getAttribute('aria-hidden')).toBe('true');
    expect(slider.getAttribute('aria-disabled')).toBe('true');
    expect(slider.getAttribute('aria-readonly')).toBe('true');
    expect(slider.getAttribute('aria-invalid')).toBe('true');
    expect(slider.getAttribute('tabindex')).toBe('-1');
  });

  it('changes the value with the arrow keys, within the range', async () => {
    const onChange = vi.fn();
    /** @type {ComponentProps<typeof Slider>} */
    const props = $state({ value: 2, min: 0, max: 3, step: 1, onChange });
    const screen = await renderSlider(props);
    const slider = /** @type {HTMLElement} */ (screen.container.querySelector('[role="slider"]'));

    await waitForInit(screen.container);
    onChange.mockClear();
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(props.value).toBe(3);
    await userEvent.keyboard('{ArrowUp}');
    expect(props.value).toBe(3);
    await userEvent.keyboard('{ArrowLeft}{ArrowDown}');
    expect(props.value).toBe(1);
    await vi.waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({ value: 1 });
    });
    await expect.element(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '1');
  });

  it('jumps with Home, End and the Page keys', async () => {
    /** @type {ComponentProps<typeof Slider>} */
    const props = $state({ value: 50, min: 0, max: 100, step: 1 });
    const screen = await renderSlider(props);
    const slider = /** @type {HTMLElement} */ (screen.container.querySelector('[role="slider"]'));

    await waitForInit(screen.container);
    slider.focus();
    await userEvent.keyboard('{PageUp}');
    expect(props.value).toBe(60);
    await userEvent.keyboard('{PageDown}{PageDown}');
    expect(props.value).toBe(40);
    await userEvent.keyboard('{End}');
    expect(props.value).toBe(100);
    await userEvent.keyboard('{Home}');
    expect(props.value).toBe(0);
  });

  it('is named only when a label is given, and reads out the option label as the value', async () => {
    const screen = await renderSlider({
      value: 1,
      min: 0,
      max: 2,
      optionLabels: ['Low', 'Mid', 'High'],
    });

    const slider = screen.getByRole('slider');

    await waitForInit(screen.container);
    expect(slider.element().hasAttribute('aria-label')).toBe(false);
    await expect.element(slider).toHaveAttribute('aria-valuetext', 'Mid');

    const labelled = await renderSlider({ value: 5, ariaLabelledby: 'volume-label' });

    expect(
      labelled.container.querySelector('[role="slider"]')?.getAttribute('aria-labelledby'),
    ).toBe('volume-label');
    // Labels that don’t line up with the steps aren’t used as value text
    expect(
      labelled.container.querySelector('[role="slider"]')?.hasAttribute('aria-valuetext'),
    ).toBe(false);
  });

  it('ignores the keyboard while disabled or read-only, or with a modifier', async () => {
    /** @type {ComponentProps<typeof Slider>} */
    const props = $state({ value: 2, readonly: true });
    const screen = await renderSlider(props);
    const slider = /** @type {HTMLElement} */ (screen.container.querySelector('[role="slider"]'));

    await waitForInit(screen.container);
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(props.value).toBe(2);

    props.readonly = false;
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(props.value).toBe(2);
    await userEvent.keyboard('{ArrowRight}');
    expect(props.value).toBe(3);
  });

  it('swaps the horizontal arrow keys in a right-to-left locale', async () => {
    setRTL(true);

    /** @type {ComponentProps<typeof Slider>} */
    const props = $state({ value: 2, min: 0, max: 5 });
    const screen = await renderSlider(props);
    const slider = /** @type {HTMLElement} */ (screen.container.querySelector('[role="slider"]'));

    await waitForInit(screen.container);
    slider.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(props.value).toBe(3);
    await userEvent.keyboard('{ArrowRight}');
    expect(props.value).toBe(2);
    // Other keys are left alone
    await userEvent.keyboard('{Enter}');
    expect(props.value).toBe(2);

    // The physical position is mirrored as well: the minimum sits on the right
    const base = /** @type {HTMLElement} */ (screen.container.querySelector('.base'));
    const { left, width, top, height } = base.getBoundingClientRect();

    const init = {
      bubbles: true,
      clientX: left + width * 0.15,
      clientY: top + height / 2,
      screenX: left + width * 0.15,
      screenY: top + height / 2,
      pointerId: 1,
    };

    base.dispatchEvent(new PointerEvent('pointerdown', init));
    /** @type {HTMLElement} */ (base.querySelector('.base-bar')).dispatchEvent(
      new PointerEvent('pointerup', init),
    );
    expect(props.value).toBe(4);
  });

  it('ignores the pointer while read-only, and disables both thumbs', async () => {
    /** @type {ComponentProps<typeof Slider>} */
    const props = $state({ values: [2, 4], min: 0, max: 10, readonly: true, disabled: true });
    const screen = await renderSlider(props);

    await waitForInit(screen.container);

    const base = /** @type {HTMLElement} */ (screen.container.querySelector('.base'));
    const init = { bubbles: true, clientX: 0, clientY: 0, screenX: 0, screenY: 0, pointerId: 1 };

    base.dispatchEvent(new PointerEvent('pointerdown', init));
    document.dispatchEvent(
      new PointerEvent('pointermove', { ...init, clientX: 100, screenX: 100 }),
    );
    expect(props.values).toEqual([2, 4]);
    screen.container.querySelectorAll('[role="slider"]').forEach((thumb) => {
      expect(thumb.getAttribute('tabindex')).toBe('-1');
      expect(thumb.getAttribute('aria-disabled')).toBe('true');
    });
  });

  it('moves the thumb to the nearest step when the track is clicked', async () => {
    /** @type {ComponentProps<typeof Slider>} */
    const props = $state({ value: 0, min: 0, max: 10, step: 1 });
    const screen = await renderSlider(props);

    await waitForInit(screen.container);

    const base = /** @type {HTMLElement} */ (screen.container.querySelector('.base'));
    const { left, width, top, height } = base.getBoundingClientRect();
    const x = left + width * 0.72;
    const y = top + height / 2;
    const init = { bubbles: true, clientX: x, clientY: y, screenX: x, screenY: y, pointerId: 1 };

    base.dispatchEvent(new PointerEvent('pointerdown', init));
    /** @type {HTMLElement} */ (base.querySelector('.base-bar')).dispatchEvent(
      new PointerEvent('pointerup', init),
    );
    expect(props.value).toBe(7);
  });

  it('drags the thumb', async () => {
    /** @type {ComponentProps<typeof Slider>} */
    const props = $state({ value: 0, min: 0, max: 10, step: 1 });
    const screen = await renderSlider(props);

    await waitForInit(screen.container);

    const base = /** @type {HTMLElement} */ (screen.container.querySelector('.base'));
    const thumb = /** @type {HTMLElement} */ (base.querySelector('[role="slider"]'));
    const { left, width, top, height } = base.getBoundingClientRect();
    const y = top + height / 2;

    /**
     * Make a pointer event at the given fraction of the track.
     * @param {string} type Event type.
     * @param {number} fraction Position along the track.
     * @returns {PointerEvent} Event.
     */
    const at = (type, fraction) =>
      new PointerEvent(type, {
        bubbles: true,
        clientX: left + width * fraction,
        clientY: y,
        screenX: left + width * fraction,
        screenY: y,
        pointerId: 1,
      });

    thumb.dispatchEvent(at('pointerdown', 0));
    expect(props.value).toBe(0);
    document.dispatchEvent(at('pointermove', 0.3));
    expect(props.value).toBe(3);
    document.dispatchEvent(at('pointermove', 0.5));
    expect(props.value).toBe(5);
    // Becoming read-only mid-drag stops the thumb
    props.readonly = true;
    document.dispatchEvent(at('pointermove', 0.7));
    expect(props.value).toBe(5);
    props.readonly = false;
    // A release from another pointer doesn’t end the drag
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 2 }));
    document.dispatchEvent(at('pointermove', 0.6));
    expect(props.value).toBe(6);
    thumb.dispatchEvent(at('pointerup', 0.6));
    // Once released, further moves and releases are ignored
    document.dispatchEvent(at('pointermove', 0.9));
    thumb.dispatchEvent(at('pointerup', 0.9));
    expect(props.value).toBe(6);
  });

  it('supports two thumbs that cannot cross each other', async () => {
    const onChange = vi.fn();

    /** @type {ComponentProps<typeof Slider>} */
    const props = $state({
      values: [2, 4],
      min: 0,
      max: 10,
      step: 1,
      sliderLabels: ['From', 'To'],
      onChange,
    });

    const screen = await renderSlider(props);
    const from = screen.getByRole('slider', { name: 'From' });
    const to = screen.getByRole('slider', { name: 'To' });

    await waitForInit(screen.container);
    await expect.element(from).toHaveAttribute('aria-valuenow', '2');
    await expect.element(to).toHaveAttribute('aria-valuenow', '4');

    const bar = /** @type {HTMLElement} */ (screen.container.querySelector('.slider-bar'));

    const barWidth = /** @type {HTMLElement} */ (screen.container.querySelector('.base'))
      .clientWidth;

    expect(bar.style.insetInlineStart).toBe(`${barWidth * 0.2}px`);
    expect(bar.style.width).toBe(`${barWidth * 0.2}px`);

    /** @type {HTMLElement} */ (from.element()).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(props.values).toEqual([3, 4]);
    // The first thumb stops short of the second one
    await userEvent.keyboard('{ArrowRight}');
    expect(props.values).toEqual([3, 4]);

    /** @type {HTMLElement} */ (to.element()).focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(props.values).toEqual([3, 4]);
    await userEvent.keyboard('{ArrowRight}');
    expect(props.values).toEqual([3, 5]);
    await vi.waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({ values: [3, 5] });
    });
  });

  it('drags the second thumb, and stops dragging when the page is clicked', async () => {
    /** @type {ComponentProps<typeof Slider>} */
    const props = $state({
      values: [2, 4],
      min: 0,
      max: 10,
      step: 1,
      sliderLabels: ['From', 'To'],
    });

    const screen = await renderSlider(props);

    await waitForInit(screen.container);

    const base = /** @type {HTMLElement} */ (screen.container.querySelector('.base'));
    const thumb = /** @type {HTMLElement} */ (screen.getByRole('slider', { name: 'To' }).element());
    const { left, width, top, height } = base.getBoundingClientRect();

    /**
     * Make a pointer event at the given fraction of the track.
     * @param {string} type Event type.
     * @param {number} fraction Position along the track.
     * @returns {PointerEvent} Event.
     */
    const at = (type, fraction) =>
      new PointerEvent(type, {
        bubbles: true,
        clientX: left + width * fraction,
        clientY: top + height / 2,
        screenX: left + width * fraction,
        screenY: top + height / 2,
        pointerId: 1,
      });

    thumb.dispatchEvent(at('pointerdown', 0.4));
    document.dispatchEvent(at('pointermove', 0.8));
    expect(props.values).toEqual([2, 8]);
    // It cannot be dragged past the first thumb
    document.dispatchEvent(at('pointermove', 0.1));
    expect(props.values).toEqual([2, 8]);
    // A click anywhere on the page ends the drag
    document.body.click();
    document.dispatchEvent(at('pointermove', 0.9));
    expect(props.values).toEqual([2, 8]);
  });

  it('renders the option labels along the track', async () => {
    const screen = await renderSlider({ value: 0, optionLabels: ['Low', 'Mid', 'High'] });

    await waitForInit(screen.container);

    const labels = /** @type {HTMLElement[]} */ ([...screen.container.querySelectorAll('.label')]);

    const barWidth = /** @type {HTMLElement} */ (screen.container.querySelector('.base'))
      .clientWidth;

    expect(labels.map((label) => label.textContent?.trim())).toEqual(['Low', 'Mid', 'High']);
    expect(labels[0].style.insetInlineStart).toBe('0px');
    expect(labels[1].style.insetInlineStart).toBe(`${barWidth / 2}px`);
    expect(labels[2].style.insetInlineStart).toBe(`${barWidth}px`);
  });
});
