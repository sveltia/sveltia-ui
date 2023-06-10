<!--
  @component
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range
  @see https://w3c.github.io/aria/#slider
  @see https://www.w3.org/WAI/ARIA/apg/patterns/slider/
  @see https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/
-->
<script>
  import { createEventDispatcher, onMount } from 'svelte';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  export let value = 0;
  export let sliderLabel = '';
  export let values = undefined;
  export let sliderLabels = [];
  export let min = 0;
  export let max = 100;
  export let step = 1;
  export let optionLabels = [];

  $: multiThumb = !!values;

  const dispatch = createEventDispatcher();
  /** @type {HTMLElement?} */
  let base = undefined;
  let barWidth = 0;
  let positionList = [];
  let valueList = [];
  let startX = 0;
  let startScreenX = 0;
  const sliderPositions = [0, 0];
  let dragging = false;
  let targetValueIndex = 0;

  /**
   *
   * @param {number} diff
   */
  const dragSlider = (diff) => {
    if (diff >= 0 && diff <= barWidth) {
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
    }
  };

  /**
   *
   * @param {KeyboardEvent} event `keydown` event.
   * @param {number} [valueIndex]
   */
  const onKeyDown = (event, valueIndex = 0) => {
    const { key, shiftKey, altKey, ctrlKey, metaKey } = event;

    if (shiftKey || altKey || ctrlKey || metaKey) {
      return;
    }

    let index = -1;

    if (['ArrowDown', 'ArrowLeft'].includes(key)) {
      if (value > min) {
        index = valueList.indexOf(value) - 1;
      }

      event.preventDefault();
      event.stopPropagation();
    }

    if (['ArrowUp', 'ArrowRight'].includes(key)) {
      if (value < max) {
        index = valueList.indexOf(value) + 1;
      }

      event.preventDefault();
      event.stopPropagation();
    }

    if (index > -1) {
      if (
        multiThumb &&
        ((targetValueIndex === 0 && sliderPositions[1] <= positionList[index]) ||
          (targetValueIndex === 1 && sliderPositions[0] >= positionList[index]))
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
   *
   * @param {MouseEvent} event `mousedown` event.
   * @param {number} [valueIndex]
   */
  const onMouseDown = (event, valueIndex = 0) => {
    const { clientX, screenX } = event;

    dragging = true;
    startX = clientX - base.getBoundingClientRect().x;
    startScreenX = screenX;
    targetValueIndex = valueIndex;
  };

  /**
   *
   * @param {MouseEvent} event `mousemove` event.
   */
  const onMouseMove = (event) => {
    if (dragging) {
      dragSlider(startX + (event.screenX - startScreenX));
    }
  };

  /**
   *
   * @param {MouseEvent} event `click` event.
   */
  const onClick = (event) => {
    if (!multiThumb && !dragging) {
      dragSlider(/** @type {any} */ (event).layerX);
    }

    if (dragging) {
      dragging = false;
    }
  };

  /**
   *
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

  onMount(() => {
    barWidth = base.clientWidth;

    const stepCount = (max - min) / step + 1;
    const stepWidth = barWidth / (stepCount - 1);

    valueList = new Array(stepCount).fill(0).map((_, index) => index * step + min, 10);
    positionList = new Array(stepCount).fill(0).map((_, index) => index * stepWidth);

    onValueChange();
  });

  // @ts-ignore Arguments are triggers
  $: onValueChange(value, values);
</script>

<svelte:body
  on:mousemove={onMouseMove}
  on:click={() => {
    dragging = false;
  }}
/>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="sui slider {className}" on:click|preventDefault|stopPropagation>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    class="base"
    bind:this={base}
    on:click|preventDefault|stopPropagation={(event) => {
      onClick(event);
    }}
  >
    <div
      class="bar"
      style:left="{multiThumb ? sliderPositions[0] : 0}px"
      style:width="{multiThumb ? sliderPositions[1] - sliderPositions[0] : sliderPositions[0]}px"
    />
    <div
      role="slider"
      tabindex="0"
      aria-label={multiThumb ? sliderLabels[0] || '' : sliderLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      style:left="{sliderPositions[0]}px"
      on:mousedown={(event) => {
        onMouseDown(event, 0);
      }}
      on:keydown={(event) => {
        onKeyDown(event, 0);
      }}
    />
    {#if multiThumb}
      <div
        role="slider"
        tabindex="0"
        aria-label={sliderLabels[1] || ''}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        style:left="{sliderPositions[1]}px"
        on:mousedown={(event) => {
          onMouseDown(event, 1);
        }}
        on:keydown={(event) => {
          onKeyDown(event, 1);
        }}
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
    padding: 16px;
  }

  .base {
    position: relative;
    width: var(--slider-base-width, 200px);
    height: 8px;
    border-radius: 8px;
    background-color: var(--control-border-color);
  }

  .bar {
    position: absolute;
    top: 0;
    height: 8px;
    border-radius: 8px;
    background-color: var(--primary-accent-color-lighter);
  }

  [role='slider'] {
    position: absolute;
    top: 0;
    border: 2px solid var(--primary-accent-color-lighter);
    border-radius: 8px;
    width: 16px;
    height: 16px;
    background-color: var(--primary-accent-color-foreground);
    cursor: pointer;
    transform: translate(-8px, -4px);
  }

  .label {
    position: absolute;
    top: 12px;
    transform: translateX(-50%);
    font-size: var(--font-size--x-small);
  }
</style>
