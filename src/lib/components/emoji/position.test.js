import { describe, expect, it } from 'vitest';
import { getSuggestionListPosition, LIST_WIDTH } from './position.js';

const viewport = { width: 1000, height: 800 };
const listMaxHeight = 180;

describe('getSuggestionListPosition', () => {
  it('should hang below the caret by default', () => {
    const position = getSuggestionListPosition({
      anchorRect: { top: 100, bottom: 120, left: 200, right: 240 },
      listMaxHeight,
      viewport,
      rtl: false,
    });

    expect(position).toEqual({
      top: '124px',
      bottom: undefined,
      left: '200px',
      maxHeight: '180px',
    });
  });

  it('should flip above the caret when there is more room there', () => {
    const position = getSuggestionListPosition({
      anchorRect: { top: 700, bottom: 720, left: 200, right: 240 },
      listMaxHeight,
      viewport,
      rtl: false,
    });

    expect(position.top).toBeUndefined();
    expect(position.bottom).toBe(`${800 - 700 + 4}px`);
    expect(position.maxHeight).toBe('180px');
  });

  it('should stay below and shrink when there is little room on either side', () => {
    const position = getSuggestionListPosition({
      anchorRect: { top: 50, bottom: 70, left: 0, right: 40 },
      listMaxHeight,
      viewport: { width: 1000, height: 200 },
      rtl: false,
    });

    expect(position.top).toBe('74px');
    expect(position.bottom).toBeUndefined();
    // 130px below the caret, minus the offset and the margin
    expect(position.maxHeight).toBe('118px');
  });

  it('should shrink when flipped into a short space', () => {
    const position = getSuggestionListPosition({
      anchorRect: { top: 150, bottom: 170, left: 0, right: 40 },
      listMaxHeight,
      viewport: { width: 1000, height: 200 },
      rtl: false,
    });

    expect(position.bottom).toBe('54px');
    expect(position.maxHeight).toBe('138px');
  });

  it('should keep the list within the viewport horizontally', () => {
    const near = getSuggestionListPosition({
      anchorRect: { top: 100, bottom: 120, left: 2, right: 40 },
      listMaxHeight,
      viewport,
      rtl: false,
    });

    const far = getSuggestionListPosition({
      anchorRect: { top: 100, bottom: 120, left: 900, right: 940 },
      listMaxHeight,
      viewport,
      rtl: false,
    });

    expect(near.left).toBe('8px');
    expect(far.left).toBe(`${1000 - LIST_WIDTH - 8}px`);
  });

  it('should hang from the right edge of the shortcode in RTL', () => {
    const position = getSuggestionListPosition({
      anchorRect: { top: 100, bottom: 120, left: 600, right: 640 },
      listMaxHeight,
      viewport,
      rtl: true,
    });

    expect(position.left).toBe(`${640 - LIST_WIDTH}px`);
  });

  it('should round fractional pixels', () => {
    const position = getSuggestionListPosition({
      anchorRect: { top: 100.4, bottom: 120.6, left: 200.5, right: 240 },
      listMaxHeight,
      viewport,
      rtl: false,
    });

    expect(position.top).toBe('125px');
    expect(position.left).toBe('201px');
  });
});
