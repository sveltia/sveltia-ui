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
  import { onMount, untrack } from 'svelte';
  import { hasModifier } from '../../services/navigation.js';
  import { startPointerDrag } from '../../services/pointer-drag.js';
  import LabelAbove from '../util/label-above.svelte';
  import {
    clampThumbIndex,
    findNearestStepIndex,
    getNearestThumbIndex,
    getSliderCurrentIndex,
    getSliderKeyDirection,
    getSliderKeyTargetIndex,
    getSliderSteps,
    toLogicalX,
  } from './slider.js';

  /**
   * @import { ContainerProps, LabelAboveProps, WidgetStateProps } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {number} [value] Current value.
   * @property {number} [min] Minimum allowed value. An alias of the `aria-valuemin` attribute.
   * @property {number} [max] Maximum allowed value. An alias of the `aria-valuemax` attribute.
   * @property {string} [sliderLabel] `aria-label` on the slider. With `showLabelAbove`, it’s also
   * shown above the slider, where it names a multi-thumb slider’s pair of thumbs as a group.
   * @property {string} [ariaLabelledby] `aria-labelledby` on a single-thumb slider, for a visible
   * label elsewhere on the page.
   * @property {[number, number]} [values] Value list for a multi-thumb slider.
   * @property {[string, string]} [sliderLabels] `aria-label` on a multi-thumb slider.
   * @property {number} [step] Step option like `<input type="range">`.
   * @property {(string[] | number[])} [optionLabels] Visible labels on the slider. When there is
   * one per step, the current one is also read out as the value (`aria-valuetext`).
   * @property {boolean} [readonly] Whether to make the widget read-only. An alias of the
   * `aria-readonly` attribute.
   * @property {boolean} [invalid] Whether to mark the widget invalid. An alias of the
   * `aria-invalid` attribute.
   * @property {(detail: { values?: number[], value?: number }) => void} [onChange] `change` event
   * handler.
   */

  /**
   * @type {LabelAboveProps & ContainerProps & WidgetStateProps & Props & Record<string, any>}
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
    showLabelAbove = false,
    children,
    onChange,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const multiThumb = $derived(Array.isArray(values));
  const uid = $props.id();
  const labelAbove = $derived(showLabelAbove ? sliderLabel : '');

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
  let targetValueIndex = $state(0);
  /**
   * Function to stop following the pointer in the middle of a drag.
   * @type {(() => void) | undefined}
   */
  let stopDrag;

  /**
   * Set the value of a thumb, and fire the `change` event if it’s actually changed. This is only
   * called for user actions, so the event doesn’t fire when the slider is mounted or resized.
   * @param {number} valueIndex Index in the {@link values} array, `0` for a single-thumb slider.
   * @param {number} newValue New value.
   */
  const setValue = (valueIndex, newValue) => {
    const _values = /** @type {[number, number]} */ (values);

    if ((multiThumb ? _values[valueIndex] : value) === newValue) {
      return;
    }

    if (multiThumb) {
      _values[valueIndex] = newValue;
      values = [..._values];
      onChange?.({ values });
    } else {
      value = newValue;
      onChange?.({ value });
    }
  };

  /**
   * Move a thumb with mouse.
   * @param {number} physicalX Physical X position in pixels from the left edge.
   */
  const moveThumb = (physicalX) => {
    let index = findNearestStepIndex(positionList, toLogicalX(physicalX, barWidth, isRTL()));

    // Stop at the other thumb rather than ignoring the move, so a fast drag past it still brings
    // the thumb as close as it can get
    if (multiThumb) {
      index = clampThumbIndex({
        valueIndex: targetValueIndex,
        index,
        positionList,
        sliderPositions,
      });
    }

    if (index === -1) {
      return;
    }

    setValue(targetValueIndex, valueList[index]);
  };

  /**
   * Handle the `keydown` event fired on the slider.
   * @param {KeyboardEvent} event `keydown` event.
   * @param {number} [valueIndex] Index in the {@link values} array to be used to get/set the value.
   */
  const onKeyDown = (event, valueIndex = 0) => {
    const { key } = event;

    if (disabled || readonly || hasModifier(event)) {
      return;
    }

    const _value = multiThumb ? /** @type {[number, number]} */ (values)[valueIndex] : value;
    const rtl = isRTL();

    let index = getSliderKeyTargetIndex({
      key,
      rtl,
      currentIndex: getSliderCurrentIndex({
        valueList,
        value: _value,
        decreasing: key === 'PageDown' || getSliderKeyDirection(key, rtl) === -1,
      }),
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

    if (multiThumb) {
      const targetValue = valueList[index];

      // Stop at the other thumb rather than ignoring the key, so Home, End and the Page keys still
      // bring the thumb as close as it can get
      index = clampThumbIndex({ valueIndex, index, positionList, sliderPositions });

      // Don’t move the thumb at all if the clamped step lies the other way, which can happen when
      // the value sits between two steps
      if (
        index === -1 ||
        Math.sign(valueList[index] - _value) !== Math.sign(targetValue - _value)
      ) {
        return;
      }
    }

    setValue(valueIndex, valueList[index]);
  };

  /**
   * Handle the `pointermove` event fired anywhere on the page while dragging.
   * @param {PointerEvent} event `pointermove` event.
   */
  const onPointerMove = (event) => {
    if (disabled || readonly) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const screenDiff = event.screenX - startScreenX;
    // Calculate new physical position from left edge
    const physicalX = startX + screenDiff;

    moveThumb(physicalX);
  };

  /**
   * Handle the end of a drag.
   * @param {PointerEvent} event `pointerup` or `pointercancel` event, or `pointermove` event of a
   * mouse that no longer has the primary button held down.
   */
  const onDragEnd = (event) => {
    stopDrag = undefined;

    if (disabled || readonly) {
      return;
    }

    event.stopPropagation();

    // Handle a click on the bars, but not a drag ended by a mouse moved without the button held
    if (
      event.type !== 'pointermove' &&
      /** @type {HTMLElement} */ (event.target).matches('.base-bar, .slider-bar')
    ) {
      const rect = /** @type {HTMLElement} */ (base).getBoundingClientRect();
      // Get physical X position from left edge
      const physicalX = event.clientX - rect.left;

      moveThumb(physicalX);
    }

    // Reset everything
    startX = 0;
    startScreenX = 0;
    targetValueIndex = 0;
  };

  /**
   * Handle the `pointerdown` event fired on the slider.
   * @param {PointerEvent} event `pointerdown` event.
   * @param {number} [valueIndex] Index in the {@link values} array to be used to get/set the value.
   * Omitted when the track is pressed, so the thumb nearest to the pointer is used.
   */
  const onPointerDown = (event, valueIndex) => {
    if (disabled || readonly) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const { clientX, screenX, target } = event;
    const rect = /** @type {HTMLElement} */ (base).getBoundingClientRect();

    // A pointer pressed while another one is dragging takes over
    stopDrag?.();
    // Store physical X position from left edge (same in LTR and RTL)
    startX = clientX - rect.left;
    startScreenX = screenX;
    targetValueIndex =
      valueIndex ??
      (multiThumb
        ? getNearestThumbIndex(sliderPositions, toLogicalX(startX, barWidth, isRTL()))
        : 0);
    stopDrag = startPointerDrag(/** @type {HTMLElement} */ (target), event, {
      onMove: onPointerMove,
      onEnd: onDragEnd,
    });
  };

  /**
   * Get the thumb position for a value. A value that doesn’t sit on a step, such as `55` with a
   * step of `10`, is kept as is until the user moves the thumb, but drawn at the nearest step.
   * @param {number} _value Value.
   * @returns {number} Position in pixels.
   */
  const getPosition = (_value) => positionList[findNearestStepIndex(valueList, _value)] ?? 0;

  /**
   * Update the thumb positions when the value or the track is changed.
   */
  const updatePositions = () => {
    if (multiThumb) {
      const [value0, value1] = /** @type {[number, number]} */ (values);

      sliderPositions[0] = getPosition(value0);
      sliderPositions[1] = getPosition(value1);
    } else {
      sliderPositions[0] = getPosition(value);
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
    updatePositions();
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
      // Stop listening if the slider is removed in the middle of a drag
      stopDrag?.();
    };
  });

  $effect(() => {
    void value;
    void values;
    updatePositions();
  });

  // The steps are worked out from the range, so they have to follow a change to it, or the keys,
  // the thumbs and the drag would keep using the old range
  $effect(() => {
    void min;
    void max;
    void step;
    untrack(init);
  });
</script>

<svelte:body
  onclick={() => {
    stopDrag?.();
    stopDrag = undefined;
  }}
/>

<!-- A multi-thumb slider’s label above names the pair of thumbs, which have labels of their own -->
<div
  {...restProps}
  role={labelAbove && multiThumb ? 'group' : 'none'}
  aria-labelledby={labelAbove && multiThumb ? `${uid}-label` : undefined}
  class="sui slider {className}"
  class:disabled
  class:readonly
  class:invalid
  {hidden}
>
  {#if labelAbove}
    <!-- A thumb is a `<div>`, which a label can’t point to -->
    <LabelAbove
      id="{uid}-label"
      label={labelAbove}
      getTarget={() => base?.querySelector('[role="slider"]')}
    />
  {/if}
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

    // The label above isn’t part of the track, so pointing at it doesn’t highlight the track.
    // `:where()` keeps the specificity low enough for the read-only style below to win
    &:hover:where(:not(:has(:global(.label-above:hover)))) {
      .base-bar {
        background-color: var(--sui-hover-background-color);
      }
    }

    &:active:where(:not(:has(:global(.label-above:active)))) {
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
