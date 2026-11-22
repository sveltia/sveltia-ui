import { describe, expect, it } from 'vitest';
import { getAccessibleText, getTooltipPosition, TOOLTIP_GAP, toggleIdInList } from './tooltip.js';

const viewport = { width: 800, height: 600 };
const size = { width: 100, height: 30 };

/**
 * Create an anchor rect.
 * @param {number} left Left edge.
 * @param {number} top Top edge.
 * @param {number} [width] Width.
 * @param {number} [height] Height.
 * @returns {{ top: number, right: number, bottom: number, left: number, width: number,
 * height: number }} Rect.
 */
const rect = (left, top, width = 32, height = 32) => ({
  top,
  right: left + width,
  bottom: top + height,
  left,
  width,
  height,
});

describe('getTooltipPosition', () => {
  it('should centre the tooltip below its anchor by default', () => {
    expect(getTooltipPosition({ anchorRect: rect(300, 100), viewport, size })).toEqual({
      top: 132 + TOOLTIP_GAP,
      left: 266,
      placement: 'bottom',
    });
  });

  it('should move it above when there’s more room there', () => {
    expect(getTooltipPosition({ anchorRect: rect(300, 560), viewport, size })).toEqual({
      top: 560 - TOOLTIP_GAP - 30,
      left: 266,
      placement: 'top',
    });
  });

  it('should keep it below when neither side fits and below has more room', () => {
    expect(
      getTooltipPosition({
        anchorRect: rect(300, 10, 32, 10),
        viewport: { width: 800, height: 40 },
        size,
      }).placement,
    ).toBe('bottom');
  });

  it('should keep it within the viewport', () => {
    expect(getTooltipPosition({ anchorRect: rect(0, 100), viewport, size }).left).toBe(TOOLTIP_GAP);
    expect(getTooltipPosition({ anchorRect: rect(780, 100, 20), viewport, size }).left).toBe(
      800 - 100 - TOOLTIP_GAP,
    );
  });

  it('should put it on the given side', () => {
    expect(
      getTooltipPosition({ anchorRect: rect(300, 100), viewport, size, position: 'top' }),
    ).toEqual({ top: 100 - TOOLTIP_GAP - 30, left: 266, placement: 'top' });
    expect(
      getTooltipPosition({ anchorRect: rect(300, 100), viewport, size, position: 'bottom' }),
    ).toEqual({ top: 132 + TOOLTIP_GAP, left: 266, placement: 'bottom' });
    // Centred vertically beside the anchor
    expect(
      getTooltipPosition({ anchorRect: rect(300, 100), viewport, size, position: 'right' }),
    ).toEqual({ top: 101, left: 332 + TOOLTIP_GAP, placement: 'right' });
    expect(
      getTooltipPosition({ anchorRect: rect(300, 100), viewport, size, position: 'left' }),
    ).toEqual({ top: 101, left: 300 - TOOLTIP_GAP - 100, placement: 'left' });
  });

  it('should move it to the opposite side when there’s no room on the given one', () => {
    expect(
      getTooltipPosition({ anchorRect: rect(300, 10), viewport, size, position: 'top' }).placement,
    ).toBe('bottom');
    expect(
      getTooltipPosition({ anchorRect: rect(10, 100), viewport, size, position: 'left' }).placement,
    ).toBe('right');
    expect(
      getTooltipPosition({ anchorRect: rect(760, 100), viewport, size, position: 'right' })
        .placement,
    ).toBe('left');
  });

  it('should keep a tooltip beside its anchor within the viewport vertically', () => {
    expect(
      getTooltipPosition({ anchorRect: rect(300, 0, 32, 10), viewport, size, position: 'right' })
        .top,
    ).toBe(TOOLTIP_GAP);
    expect(
      getTooltipPosition({ anchorRect: rect(300, 590, 32, 10), viewport, size, position: 'left' })
        .top,
    ).toBe(600 - 30 - TOOLTIP_GAP);
  });
});

describe('getTooltipPosition in a right-to-left context', () => {
  it('should swap left and right, like the popup positions', () => {
    expect(
      getTooltipPosition({
        anchorRect: rect(300, 100),
        viewport,
        size,
        position: 'right',
        rtl: true,
      }).placement,
    ).toBe('left');
    expect(
      getTooltipPosition({
        anchorRect: rect(300, 100),
        viewport,
        size,
        position: 'left',
        rtl: true,
      }).placement,
    ).toBe('right');
    // Above and below stay where they are
    expect(
      getTooltipPosition({ anchorRect: rect(300, 100), viewport, size, position: 'top', rtl: true })
        .placement,
    ).toBe('top');
  });
});

describe('getAccessibleText', () => {
  it('should leave out the text hidden from screen readers, such as an icon’s name', () => {
    const button = document.createElement('button');

    button.innerHTML =
      '<span aria-hidden="true">save</span> <span class="label"><span>Save</span></span><!-- x -->';
    expect(getAccessibleText(button)).toBe('Save');
  });

  it('should keep the text of inline elements together', () => {
    const button = document.createElement('button');

    button.innerHTML = 'Re<b>load</b>';
    expect(getAccessibleText(button)).toBe('Reload');
  });

  it('should collapse the white space', () => {
    const button = document.createElement('button');

    button.innerHTML = '  Save\n  <b>all</b>  ';
    expect(getAccessibleText(button)).toBe('Save all');
  });
});

describe('toggleIdInList', () => {
  it('should add an ID, keeping the others', () => {
    expect(toggleIdInList(null, 'tip', true)).toBe('tip');
    expect(toggleIdInList('note', 'tip', true)).toBe('note tip');
    expect(toggleIdInList('note tip', 'tip', true)).toBe('note tip');
  });

  it('should remove an ID, keeping the others', () => {
    expect(toggleIdInList('note  tip', 'tip', false)).toBe('note');
    expect(toggleIdInList('tip', 'tip', false)).toBeNull();
    expect(toggleIdInList('', 'tip', false)).toBeNull();
  });
});
