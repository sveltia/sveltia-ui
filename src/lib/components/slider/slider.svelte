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
  import { createEventDispatcher, onMount } from 'svelte';

  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * Whether to hide the widget. An alias of the `aria-hidden` attribute.
   * @type {boolean | undefined}
   */
  export let hidden = undefined;
  /**
   * Whether to disable the widget. An alias of the `aria-disabled` attribute.
   * @type {boolean}
   */
  export let disabled = false;
  /**
   * Whether to disable the widget. An alias of the `aria-readonly` attribute.
   * @type {boolean}
   */
  export let readonly = false;
  /**
   * Whether to disable the widget. An alias of the `aria-invalid` attribute.
   * @type {boolean}
   */
  export let invalid = false;
  /**
   * Minimum allowed value. An alias of the `aria-valuemin` attribute.
   * @type {number | undefined}
   */
  export let min = 0;
  /**
   * Maximum allowed value. An alias of the `aria-valuemax` attribute.
   * @type {number | undefined}
   */
  export let max = 100;

  export let value = 0;
  export let sliderLabel = '';
  /** @type {[number, number]} */
  export let values = undefined;
  /** @type {[string, string]} */
  export let sliderLabels = undefined;
  export let step = 1;
  /** @type {(string[] | number[])} */
  export let optionLabels = [];

  $: multiThumb = !!values;

  const dispatch = createEventDispatcher();
  /** @type {HTMLElement | undefined} */
  let base = undefined;
  let barWidth = 0;
  /** @type {number[]} */
  let positionList = [];
  /** @type {number[]} */
  let valueList = [];
  let startX = 0;
  let startScreenX = 0;
  const sliderPositions = [0, 0];
  let dragging = false;
  let targetPointerId = 0;
  let targetValueIndex = 0;

  /**
   * Move a thumb with mouse.
   * @param {number} diff Distance from the original X position in pixels.
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
      values[targetValueIndex] = valueList[index];
    } else {
      value = valueList[index];
    }
  };

  /**
   * Handle the `keydown` event fired on the slider.
   * @param {KeyboardEvent} event `keydown` event.
   * @param {number} [valueIndex] Index in the {@link values} array to be used to get/set the value.
   */
  const onKeyDown = (event, valueIndex = 0) => {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    const hasModifier = shiftKey || altKey || ctrlKey || metaKey;

    if (disabled || readonly || hasModifier) {
      return;
    }

    const _value = multiThumb ? values[valueIndex] : value;
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
        values[valueIndex] = valueList[index];
      } else {
        value = valueList[index];
      }
    }
  };

  /**
   * Handle the `pointermove` event fired anywhere on the page.
   * @param {PointerEvent} event `pointermove` event.
   */
  const onPointerMove = (event) => {
    const { screenX, pointerId } = event;

    if (disabled || readonly || !dragging || pointerId !== targetPointerId) {
      return;
    }

    moveThumb(startX + (screenX - startScreenX));
  };

  /**
   * Handle the `pointerup` and `pointercancel` events fired anywhere on the page.
   * @param {PointerEvent} event `pointerup` or `pointercancel` event.
   */
  const onPointerUp = (event) => {
    const { pointerId } = event;

    if (disabled || readonly || !dragging || pointerId !== targetPointerId) {
      return;
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
   * @param {PointerEvent} event `pointerdown` event.
   * @param {number} [valueIndex] Index in the {@link values} array to be used to get/set the value.
   */
  const onPointerDown = (event, valueIndex = 0) => {
    const { clientX, screenX, pointerId } = event;

    if (disabled || readonly) {
      return;
    }

    dragging = true;
    startX = clientX - base.getBoundingClientRect().x;
    startScreenX = screenX;
    targetPointerId = pointerId;
    targetValueIndex = valueIndex;

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  };

  /**
   * Handle the `click` event fired on the slider.
   * @param {MouseEvent} event `click` event.
   */
  const onClick = (event) => {
    if (disabled || readonly || multiThumb || dragging) {
      return;
    }

    moveThumb(/** @type {any} */ (event).layerX);
  };

  /**
   * Update the thumb position and fire the `change` event when the value is changed.
   */
  const onValueChange = () => {
    if (multiThumb) {
      sliderPositions[0] = positionList[valueList.indexOf(values[0])];
      sliderPositions[1] = positionList[valueList.indexOf(values[1])];
      dispatch('change', { values });
    } else {
      sliderPositions[0] = positionList[valueList.indexOf(value)];
      dispatch('change', { value });
    }
  };

  /**
   * Initialize the variables.
   */
  const init = () => {
    barWidth = base.clientWidth;

    const stepCount = (max - min) / step + 1;
    const stepWidth = barWidth / (stepCount - 1);

    valueList = new Array(stepCount).fill(0).map((_, index) => index * step + min, 10);
    positionList = new Array(stepCount).fill(0).map((_, index) => index * stepWidth);

    onValueChange();
  };

  onMount(() => {
    const query = window.matchMedia('(pointer: coarse)');

    new ResizeObserver(() => init()).observe(base);
    query.addEventListener('change', init);
    init();

    return () => {
      query.removeEventListener('change', init);
    };
  });

  $: {
    void value;
    void values;
    onValueChange();
  }
</script>

<svelte:body
  on:click={() => {
    dragging = false;
  }}
/>

<div
  class="sui slider {className}"
  class:disabled
  role="none"
  hidden={hidden || undefined}
  {...$$restProps}
  on:click|preventDefault|stopPropagation
>
  <div
    class="base"
    role="none"
    bind:this={base}
    on:click|preventDefault|stopPropagation={(event) => onClick(event)}
  >
    <div class="base-bar" />
    <div
      class="slider-bar"
      style:left="{multiThumb ? sliderPositions[0] : 0}px"
      style:width="{multiThumb ? sliderPositions[1] - sliderPositions[0] : sliderPositions[0]}px"
    />
    <div
      role="slider"
      tabindex={disabled ? -1 : 0}
      aria-label={multiThumb ? sliderLabels?.[0] || '' : sliderLabel}
      aria-hidden={hidden}
      aria-disabled={disabled}
      aria-readonly={readonly}
      aria-invalid={invalid}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={multiThumb ? values[0] : value}
      style:left="{sliderPositions[0]}px"
      on:pointerdown={(event) => onPointerDown(event, 0)}
      on:keydown={(event) => onKeyDown(event, 0)}
    />
    {#if multiThumb}
      <div
        role="slider"
        tabindex={disabled ? -1 : 0}
        aria-label={sliderLabels?.[1] || ''}
        aria-hidden={hidden}
        aria-disabled={disabled}
        aria-readonly={readonly}
        aria-invalid={invalid}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={values[1]}
        style:left="{sliderPositions[1]}px"
        on:pointerdown={(event) => onPointerDown(event, 1)}
        on:keydown={(event) => onKeyDown(event, 1)}
      />
    {/if}
    {#if optionLabels.length}
      {#each optionLabels as label, index}
        <span
          class="label"
          role="presentation"
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
    padding: var(--sui-checkbox-height) calc(var(--sui-checkbox-height) / 2);
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
    width: var(--sui-slider-base-width, calc(var(--sui-checkbox-height) * 10));
    height: calc(var(--sui-checkbox-height) / 2);
    cursor: pointer;
  }

  .base-bar {
    border-width: 1px;
    border-style: solid;
    border-color: var(--sui-control-border-color);
    border-radius: var(--sui-checkbox-height);
    background-color: var(--sui-button-background-color);
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
  }

  .label {
    position: absolute;
    top: calc(var(--sui-checkbox-height) / 2 + 8px);
    transform: translateX(-50%);
    font-size: var(--sui-font-size-x-small);
  }
</style>
