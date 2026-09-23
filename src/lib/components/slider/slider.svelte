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
  import { isRTL } from '@sveltia/i18n';
  import { onMount } from 'svelte';
  import {
    findNearestStepIndex,
    getSliderKeyTargetIndex,
    getSliderSteps,
    toLogicalX,
    wouldCrossThumbs,
  } from './slider.js';

  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {number} [value] Current value.
   * @property {number} [min] Minimum allowed value. An alias of the `aria-valuemin` attribute.
   * @property {number} [max] Maximum allowed value. An alias of the `aria-valuemax` attribute.
   * @property {string} [sliderLabel] `aria-label` on the slider.
   * @property {string} [ariaLabelledby] `aria-labelledby` on a single-thumb slider, for a visible
   * label elsewhere on the page.
   * @property {[number, number]} [values] Value list for a multi-thumb slider.
   * @property {[string, string]} [sliderLabels] `aria-label` on a multi-thumb slider.
   * @property {number} [step] Step option like `<input type="range">`.
   * @property {(string[] | number[])} [optionLabels] Visible labels on the slider. When there is
   * one per step, the current one is also read out as the value (`aria-valuetext`).
   * @property {boolean} [flex] Make the text input container flexible.
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] Whether to hide the widget.
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {boolean} [readonly] Whether to make the widget read-only. An alias of the
   * `aria-readonly` attribute.
   * @property {boolean} [invalid] Whether to mark the widget invalid. An alias of the
   * `aria-invalid` attribute.
   * @property {Snippet} [children] Primary slot content.
   * @property {(detail: { values?: number[], value?: number }) => void} [onChange] `change` event
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
    ariaLabelledby = undefined,
    values = $bindable(undefined),
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

  /**
   * Get the text read out for a value, when the visible option labels line up with the steps.
   * @param {number | undefined} _value Value.
   * @returns {string | undefined} Matching label, if any.
   */
  const getValueText = (_value) => {
    if (optionLabels.length !== valueList.length || _value === undefined) {
      return undefined;
    }

    const index = valueList.indexOf(_value);

    return index === -1 ? undefined : String(optionLabels[index]);
  };
  let startX = $state(0);
  let startScreenX = $state(0);
  // eslint-disable-next-line prefer-const
  let sliderPositions = $state([0, 0]);
  let dragging = $state(false);
  let targetPointerId = $state(0);
  let targetValueIndex = $state(0);

  /**
   * Move a thumb with mouse.
   * @param {number} physicalX Physical X position in pixels from the left edge.
   */
  const moveThumb = (physicalX) => {
    const index = findNearestStepIndex(positionList, toLogicalX(physicalX, barWidth, isRTL()));

    if (
      sliderPositions[targetValueIndex] === positionList[index] ||
      (multiThumb &&
        wouldCrossThumbs({
          valueIndex: targetValueIndex,
          targetPosition: positionList[index],
          sliderPositions,
        }))
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
   * @param {KeyboardEvent} event `keydown` event.
   * @param {number} [valueIndex] Index in the {@link values} array to be used to get/set the value.
   */
  const onKeyDown = (event, valueIndex = 0) => {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    const hasModifier = shiftKey || altKey || ctrlKey || metaKey;

    if (disabled || readonly || hasModifier) {
      return;
    }

    const _value = multiThumb ? /** @type {[number, number]} */ (values)[valueIndex] : value;

    const index = getSliderKeyTargetIndex({
      key,
      rtl: isRTL(),
      currentIndex: valueList.indexOf(_value),
      length: valueList.length,
    });

    if (index === -1) {
      // Still swallow the key if it’s one of the slider’s, so Home/End don’t scroll the page
      if (['Home', 'End', 'PageUp', 'PageDown'].includes(key)) {
        event.preventDefault();
      }

      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (
      multiThumb &&
      wouldCrossThumbs({ valueIndex, targetPosition: positionList[index], sliderPositions })
    ) {
      return;
    }

    if (multiThumb) {
      /** @type {[number, number]} */ (values)[valueIndex] = valueList[index];
      values = [.../** @type {[number, number]} */ (values)];
    } else {
      value = valueList[index];
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

    event.preventDefault();
    event.stopPropagation();

    const screenDiff = screenX - startScreenX;
    // Calculate new physical position from left edge
    const physicalX = startX + screenDiff;

    moveThumb(physicalX);
  };

  /**
   * Handle the `pointerup` and `pointercancel` events fired anywhere on the page.
   * @param {PointerEvent} event `pointerup` or `pointercancel` event.
   */
  const onPointerUp = (event) => {
    const { pointerId, target } = event;

    if (disabled || readonly || !dragging || pointerId !== targetPointerId) {
      return;
    }

    event.stopPropagation();

    const slider = /** @type {HTMLElement} */ (target);

    // Handle a click on the bars
    if (slider.matches('.base-bar, .slider-bar')) {
      const rect = /** @type {HTMLElement} */ (base).getBoundingClientRect();
      // Get physical X position from left edge
      const physicalX = /** @type {any} */ (event).clientX - rect.left;

      moveThumb(physicalX);
    }

    // Reset everything
    slider.releasePointerCapture(pointerId);
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
    if (disabled || readonly) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    dragging = true;

    const { clientX, screenX, pointerId, target } = event;
    const slider = /** @type {HTMLElement} */ (target);
    const rect = /** @type {HTMLElement} */ (base).getBoundingClientRect();

    // Store physical X position from left edge (same in LTR and RTL)
    startX = clientX - rect.left;
    startScreenX = screenX;
    targetPointerId = pointerId;
    targetValueIndex = valueIndex;
    slider.setPointerCapture(pointerId);

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
    // Only called once mounted, when the track is bound
    /* v8 ignore next */
    if (!base) {
      return;
    }

    barWidth = base.clientWidth;
    ({ valueList, positionList } = getSliderSteps({ min, max, step, barWidth }));
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
      style:inset-inline-start={`${multiThumb ? sliderPositions[0] : 0}px`}
      style:width={`${multiThumb ? sliderPositions[1] - sliderPositions[0] : sliderPositions[0]}px`}
    ></div>
    <div
      role="slider"
      tabindex={disabled ? -1 : 0}
      aria-label={(multiThumb ? sliderLabels?.[0] : sliderLabel) || undefined}
      aria-labelledby={multiThumb ? undefined : ariaLabelledby}
      aria-hidden={hidden}
      aria-disabled={disabled}
      aria-readonly={readonly}
      aria-invalid={invalid}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={multiThumb ? values?.[0] : value}
      aria-valuetext={getValueText(multiThumb ? values?.[0] : value)}
      style:inset-inline-start={`${sliderPositions[0]}px`}
      onpointerdown={(event) => onPointerDown(event, 0)}
      onkeydown={(event) => onKeyDown(event, 0)}
    ></div>
    {#if multiThumb}
      <div
        role="slider"
        tabindex={disabled ? -1 : 0}
        aria-label={sliderLabels?.[1] || undefined}
        aria-hidden={hidden}
        aria-disabled={disabled}
        aria-readonly={readonly}
        aria-invalid={invalid}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={values?.[1]}
        aria-valuetext={getValueText(values?.[1])}
        style:inset-inline-start={`${sliderPositions[1]}px`}
        onpointerdown={(event) => onPointerDown(event, 1)}
        onkeydown={(event) => onKeyDown(event, 1)}
      ></div>
    {/if}
    {#if optionLabels.length}
      {#each optionLabels as label, index (`${index}-${label}`)}
        <span
          role="none"
          class="label"
          style:inset-inline-start="{(barWidth / (optionLabels.length - 1)) * index}px"
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

    // The value is drawn in a neutral colour and pointing at a read-only slider gives no feedback,
    // so it doesn’t look editable
    &.readonly {
      &,
      &:is(:hover, :active) {
        .base-bar {
          background-color: var(
            --sui-slider-background-color,
            var(--sui-secondary-background-color)
          );
        }
      }

      .base,
      [role='slider'] {
        cursor: default;
      }

      // An error still shows in its own colour
      &:not(.invalid) {
        .slider-bar {
          background-color: var(--sui-readonly-accent-color);
        }

        [role='slider'] {
          border-color: var(--sui-readonly-accent-color);
        }
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

    // The thumb draws at 18px; this widens the pointer target to 26px without changing the look
    // (WCAG 2.5.8 asks for 24px)
    &::before {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: inherit;
    }

    &:dir(ltr) {
      transform: translate(
        calc((var(--sui-checkbox-height) / 2 - 1px) * -1),
        calc((var(--sui-checkbox-height) / 4 - 1px) * -1)
      );
    }

    &:dir(rtl) {
      transform: translate(
        calc((var(--sui-checkbox-height) / 2 - 1px)),
        calc((var(--sui-checkbox-height) / 4 - 1px) * -1)
      );
    }

    .invalid & {
      border-color: var(--sui-error-border-color);
    }
  }

  .label {
    position: absolute;
    top: calc(var(--sui-checkbox-height) / 2 + 8px);
    font-size: var(--sui-font-size-x-small);

    &:dir(ltr) {
      transform: translateX(-50%);
    }

    &:dir(rtl) {
      transform: translateX(50%);
    }
  }
</style>
