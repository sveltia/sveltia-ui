<!--
  @component
  The equivalent of the HTML `<input type="range">` element, but it comes with the multi-thumb
  support.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range
  @see https://w3c.github.io/aria/#slider
  @see https://www.w3.org/WAI/ARIA/apg/patterns/slider/
  @see https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/
-->
<script>
  import { onMount } from 'svelte';

  /**
   * @typedef {object} Props
   * @property {number} [value] - Current value.
   * @property {number} [min] - Minimum allowed value. An alias of the `aria-valuemin` attribute.
   * @property {number} [max] - Maximum allowed value. An alias of the `aria-valuemax` attribute.
   * @property {string} [sliderLabel] - `aria-label` on the slider.
   * @property {[number, number]} [values] - Value list for a multi-thumb slider.
   * @property {[string, string]} [sliderLabels] - `aria-label` on a multi-thumb slider.
   * @property {number} [step] - Step option like `<input type="range">`.
   * @property {(string[] | number[])} [optionLabels] - Visible labels on the slider.
   * @property {boolean} [flex] - Make the text input container flexible.
   * @property {string} [class] - The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] - Whether to hide the widget.
   * @property {boolean} [disabled] - Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {boolean} [readonly] - Whether to make the widget read-only. An alias of the
   * `aria-readonly` attribute.
   * @property {boolean} [invalid] - Whether to mark the widget invalid. An alias of the
   * `aria-invalid` attribute.
   * @property {import('svelte').Snippet} [children] - Primary slot content.
   * @property {(detail: { values?: number[], value?: number }) => void} [onChange] - `change` event
   * handler.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    value = $bindable(0),
    min = 0,
    max = 100,
    sliderLabel = '',
    values = undefined,
    sliderLabels = undefined,
    step = 1,
    optionLabels = [],
    class: className,
    hidden = false,
    disabled = false,
    readonly = false,
    invalid = false,
    children,
    onChange,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const multiThumb = $derived(Array.isArray(values));

  /** @type {HTMLElement | undefined} */
  let base = $state();
  let barWidth = $state(0);
  /** @type {number[]} */
  let positionList = $state([]);
  /** @type {number[]} */
  let valueList = $state([]);
  let startX = $state(0);
  let startScreenX = $state(0);
  // eslint-disable-next-line prefer-const
  let sliderPositions = $state([0, 0]);
  let dragging = $state(false);
  let targetPointerId = $state(0);
  let targetValueIndex = $state(0);

  /**
   * Move a thumb with mouse.
   * @param {number} diff - Distance from the original X position in pixels.
   */
  const moveThumb = (diff) => {
    if (diff < 0) {
      diff = 0;
    } else if (diff > barWidth) {
      diff = barWidth;
    }

    const fromIndex = positionList.findLastIndex((s) => s <= diff);
    const toIndex = positionList.findIndex((s) => diff <= s);

    const index =
      Math.abs(positionList[fromIndex] - diff) < Math.abs(positionList[toIndex] - diff)
        ? fromIndex
        : toIndex;

    if (
      sliderPositions[targetValueIndex] === positionList[index] ||
      (multiThumb &&
        ((targetValueIndex === 0 && sliderPositions[1] <= positionList[index]) ||
          (targetValueIndex === 1 && sliderPositions[0] >= positionList[index])))
    ) {
      return;
    }

    if (multiThumb) {
      /** @type {[number, number]} */ (values)[targetValueIndex] = valueList[index];
      values = [.../** @type {[number, number]} */ (values)];
    } else {
      value = valueList[index];
    }
  };

  /**
   * Handle the `keydown` event fired on the slider.
   * @param {KeyboardEvent} event - `keydown` event.
   * @param {number} [valueIndex] - Index in the {@link values} array to be used to get/set the
   * value.
   */
  const onKeyDown = (event, valueIndex = 0) => {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    const hasModifier = shiftKey || altKey || ctrlKey || metaKey;

    if (disabled || readonly || hasModifier) {
      return;
    }

    const _value = multiThumb ? /** @type {[number, number]} */ (values)[valueIndex] : value;
    let index = -1;

    if (['ArrowDown', 'ArrowLeft'].includes(key)) {
      if (_value > min) {
        index = valueList.indexOf(_value) - 1;
      }

      event.preventDefault();
      event.stopPropagation();
    }

    if (['ArrowUp', 'ArrowRight'].includes(key)) {
      if (_value < max) {
        index = valueList.indexOf(_value) + 1;
      }

      event.preventDefault();
      event.stopPropagation();
    }

    if (index > -1) {
      if (
        multiThumb &&
        ((valueIndex === 0 && sliderPositions[1] <= positionList[index]) ||
          (valueIndex === 1 && sliderPositions[0] >= positionList[index]))
      ) {
        return;
      }

      if (multiThumb) {
        /** @type {[number, number]} */ (values)[valueIndex] = valueList[index];
        values = [.../** @type {[number, number]} */ (values)];
      } else {
        value = valueList[index];
      }
    }
  };

  /**
   * Handle the `pointermove` event fired anywhere on the page.
   * @param {PointerEvent} event - `pointermove` event.
   */
  const onPointerMove = (event) => {
    const { screenX, pointerId } = event;

    if (disabled || readonly || !dragging || pointerId !== targetPointerId) {
      return;
    }

    event.stopPropagation();

    moveThumb(startX + (screenX - startScreenX));
  };

  /**
   * Handle the `pointerup` and `pointercancel` events fired anywhere on the page.
   * @param {PointerEvent} event - `pointerup` or `pointercancel` event.
   */
  const onPointerUp = (event) => {
    const { pointerId } = event;

    if (disabled || readonly || !dragging || pointerId !== targetPointerId) {
      return;
    }

    event.stopPropagation();

    // Handle a click on the bars
    if (/** @type {HTMLElement} */ (event.target).matches('.base-bar, .slider-bar')) {
      moveThumb(/** @type {any} */ (event).layerX);
    }

    // Reset everything
    dragging = false;
    startX = 0;
    startScreenX = 0;
    targetPointerId = 0;
    targetValueIndex = 0;

    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
  };

  /**
   * Handle the `pointerdown` event fired on the slider.
   * @param {PointerEvent} event - `pointerdown` event.
   * @param {number} [valueIndex] - Index in the {@link values} array to be used to get/set the
   * value.
   */
  const onPointerDown = (event, valueIndex = 0) => {
    const { clientX, screenX, pointerId } = event;

    if (disabled || readonly) {
      return;
    }

    event.stopPropagation();

    dragging = true;
    startX = clientX - /** @type {HTMLElement} */ (base).getBoundingClientRect().x;
    startScreenX = screenX;
    targetPointerId = pointerId;
    targetValueIndex = valueIndex;

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  };

  /**
   * Update the thumb position and fire the `change` event when the value is changed.
   */
  const onValueChange = () => {
    if (multiThumb) {
      const [value0, value1] = /** @type {[number, number]} */ (values);

      sliderPositions[0] = positionList[valueList.indexOf(value0)];
      sliderPositions[1] = positionList[valueList.indexOf(value1)];
      onChange?.({ values });
    } else {
      sliderPositions[0] = positionList[valueList.indexOf(value)];
      onChange?.({ value });
    }
  };

  /**
   * Initialize the variables.
   */
  const init = () => {
    if (!base) {
      return;
    }

    barWidth = base.clientWidth;

    const stepCount = (max - min) / step + 1;
    const stepWidth = barWidth / (stepCount - 1);

    valueList = new Array(stepCount).fill(0).map((_, index) => index * step + min, 10);
    positionList = new Array(stepCount).fill(0).map((_, index) => index * stepWidth);

    onValueChange();
  };

  onMount(() => {
    const observer = new ResizeObserver(() => init());
    const query = globalThis.matchMedia('(pointer: coarse)');

    observer.observe(/** @type {HTMLElement} */ (base));
    query.addEventListener('change', init);
    init();

    return () => {
      observer.disconnect();
      query.removeEventListener('change', init);
    };
  });

  $effect(() => {
    void value;
    void values;
    onValueChange();
  });
</script>

<svelte:body
  onclick={() => {
    dragging = false;
  }}
/>

<div
  {...restProps}
  role="none"
  class="sui slider {className}"
  class:disabled
  class:readonly
  class:invalid
  {hidden}
>
  <div bind:this={base} role="none" class="base" onpointerdown={(event) => onPointerDown(event)}>
    <div role="none" class="base-bar"></div>
    <div
      class="slider-bar"
      style:left="{multiThumb ? sliderPositions[0] : 0}px"
      style:width="{multiThumb ? sliderPositions[1] - sliderPositions[0] : sliderPositions[0]}px"
    ></div>
    <div
      role="slider"
      tabindex={disabled ? -1 : 0}
      aria-label={multiThumb ? sliderLabels?.[0] : sliderLabel}
      aria-hidden={hidden}
      aria-disabled={disabled}
      aria-readonly={readonly}
      aria-invalid={invalid}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={multiThumb ? values?.[0] : value}
      style:left="{sliderPositions[0]}px"
      onpointerdown={(event) => onPointerDown(event, 0)}
      onkeydown={(event) => onKeyDown(event, 0)}
    ></div>
    {#if multiThumb}
      <div
        role="slider"
        tabindex={disabled ? -1 : 0}
        aria-label={sliderLabels?.[1]}
        aria-hidden={hidden}
        aria-disabled={disabled}
        aria-readonly={readonly}
        aria-invalid={invalid}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={values?.[1]}
        style:left="{sliderPositions[1]}px"
        onpointerdown={(event) => onPointerDown(event, 1)}
        onkeydown={(event) => onKeyDown(event, 1)}
      ></div>
    {/if}
    {#if optionLabels.length}
      {#each optionLabels as label, index}
        <span
          role="none"
          class="label"
          style:left="{(barWidth / (optionLabels.length - 1)) * index}px"
        >
          {label}
        </span>
      {/each}
    {/if}
  </div>
</div>

<style lang="scss">
  .slider {
    position: relative;
    display: inline-block;
    margin: var(--sui-focus-ring-width);
    padding: 4px 6px;
    touch-action: none;

    &:hover {
      .base-bar {
        background-color: var(--sui-hover-background-color);
      }
    }

    &:active {
      .base-bar {
        background-color: var(--sui-active-background-color);
      }
    }
  }

  .base {
    position: relative;
    width: var(--sui-slider-base-width, 240px);
    height: calc(var(--sui-checkbox-height) / 2);
    cursor: pointer;
  }

  .base-bar {
    border-width: 1px;
    border-style: solid;
    border-color: var(--sui-control-border-color);
    border-radius: var(--sui-checkbox-height);
    background-color: var(--sui-slider-background-color, var(--sui-secondary-background-color));
    transition: all 200ms;
    width: 100%;
    height: 100%;
  }

  .slider-bar {
    position: absolute;
    top: 0;
    height: calc(var(--sui-checkbox-height) / 2);
    border-radius: var(--sui-checkbox-height);
    background-color: var(--sui-primary-accent-color-light);

    .invalid & {
      background-color: var(--sui-error-border-color);
    }
  }

  [role='slider'] {
    position: absolute;
    top: 0;
    border: 3px solid var(--sui-primary-accent-color-light);
    border-radius: var(--sui-checkbox-height);
    width: calc(var(--sui-checkbox-height) - 2px);
    height: calc(var(--sui-checkbox-height) - 2px);
    background-color: var(--sui-primary-accent-color-inverted);
    cursor: pointer;
    transform: translate(
      calc((var(--sui-checkbox-height) / 2 - 1px) * -1),
      calc((var(--sui-checkbox-height) / 4 - 1px) * -1)
    );

    .invalid & {
      border-color: var(--sui-error-border-color);
    }
  }

  .label {
    position: absolute;
    top: calc(var(--sui-checkbox-height) / 2 + 8px);
    transform: translateX(-50%);
    font-size: var(--sui-font-size-x-small);
  }
</style>
