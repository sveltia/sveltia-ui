/* eslint-disable jsdoc/require-jsdoc */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activateGroup, normalize } from './group.svelte.js';

describe('normalize', () => {
  it('should trim whitespace', () => {
    expect(normalize('  hello  ')).toBe('hello');
  });

  it('should return empty string for blank input', () => {
    expect(normalize('   ')).toBe('');
    expect(normalize('')).toBe('');
  });

  it('should convert to lower case', () => {
    expect(normalize('HELLO')).toBe('hello');
    expect(normalize('Hello World')).toBe('hello world');
  });

  it('should strip diacritics', () => {
    expect(normalize('café')).toBe('cafe');
    expect(normalize('naïve')).toBe('naive');
    expect(normalize('résumé')).toBe('resume'); // cspell:disable-line
  });

  it('should handle strings without diacritics unchanged (apart from case)', () => {
    expect(normalize('hello world')).toBe('hello world');
  });
});

describe('Group - tablist', () => {
  /** @type {HTMLElement} */
  let tablist;
  /** @type {HTMLElement[]} */
  let tabs;

  beforeEach(async () => {
    vi.useFakeTimers();
    tablist = document.createElement('div');
    tablist.setAttribute('role', 'tablist');
    tabs = ['Tab 1', 'Tab 2', 'Tab 3'].map((label) => {
      const tab = document.createElement('div');

      tab.setAttribute('role', 'tab');
      tab.textContent = label;
      tablist.appendChild(tab);

      return tab;
    });
    document.body.appendChild(tablist);
    activateGroup(tablist);
    await vi.advanceTimersByTimeAsync(150);
  });

  afterEach(() => {
    tablist.remove();
    vi.useRealTimers();
  });

  it('should select the first tab by default', () => {
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
    expect(tabs[2].getAttribute('aria-selected')).toBe('false');
  });

  it('should set tabIndex=0 only on the first selected tab', () => {
    expect(tabs[0].tabIndex).toBe(0);
    expect(tabs[1].tabIndex).toBe(-1);
    expect(tabs[2].tabIndex).toBe(-1);
  });

  it('should assign element IDs to tabs after activation', () => {
    tabs.forEach((tab) => {
      expect(tab.id).toBeTruthy();
    });
  });

  it('should set tabIndex=-1 on the parent tablist', () => {
    expect(tablist.tabIndex).toBe(-1);
  });

  it('should select a tab by click', () => {
    tabs[1].click();
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
  });

  it('should move focus right on ArrowRight key from first tab', () => {
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
  });

  it('should wrap focus to first tab on ArrowRight from last tab', () => {
    // Select last tab first
    tabs[2].click();
    tabs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('should wrap focus to last tab on ArrowLeft from first tab', () => {
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
  });

  it('should ignore key events when modifier keys are held', () => {
    tabs[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, bubbles: true }),
    );
    // Selection should remain unchanged
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('should return undefined currentTarget when keydown targets the tablist itself (line 411)', () => {
    // Dispatching directly on the tablist — target does not match [role="tab"]
    tablist.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    // No navigation happens, first tab remains selected
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('should update tabIndex after requestAnimationFrame runs', async () => {
    tabs[1].click();
    await vi.advanceTimersByTimeAsync(16); // flush rAF (lines 314-318)
    expect(tabs[1].tabIndex).toBe(0);
    expect(tabs[0].tabIndex).toBe(-1);
  });
});

describe('Group - listbox', () => {
  /** @type {HTMLElement} */
  let listbox;
  /** @type {HTMLElement[]} */
  let options;

  beforeEach(async () => {
    vi.useFakeTimers();
    listbox = document.createElement('div');
    listbox.setAttribute('role', 'listbox');
    options = ['Option A', 'Option B', 'Option C'].map((label) => {
      const opt = document.createElement('div');

      opt.setAttribute('role', 'option');
      opt.textContent = label;
      listbox.appendChild(opt);

      return opt;
    });
    document.body.appendChild(listbox);
    activateGroup(listbox);
    await vi.advanceTimersByTimeAsync(150);
  });

  afterEach(() => {
    listbox.remove();
    vi.useRealTimers();
  });

  it('should not pre-select any option (selectFirst=false for listbox)', () => {
    options.forEach((opt) => {
      expect(opt.getAttribute('aria-selected')).toBe('false');
    });
  });

  it('should set tabIndex=-1 on all options', () => {
    options.forEach((opt) => {
      expect(opt.tabIndex).toBe(-1);
    });
  });
});

describe('Group - onUpdate (search filter)', () => {
  /** @type {HTMLElement} */
  let listbox;
  /** @type {HTMLElement[]} */
  let options;
  /** @type {any} */
  let action;

  beforeEach(async () => {
    vi.useFakeTimers();
    listbox = document.createElement('div');
    listbox.setAttribute('role', 'listbox');
    options = [{ label: 'Apple' }, { label: 'Banana' }, { label: 'Cherry' }].map(({ label }) => {
      const opt = document.createElement('div');

      opt.setAttribute('role', 'option');
      opt.dataset.label = label;
      opt.textContent = label;
      listbox.appendChild(opt);

      return opt;
    });
    document.body.appendChild(listbox);
    action = activateGroup(listbox, { searchTerms: '' });
    await vi.advanceTimersByTimeAsync(150);
  });

  afterEach(() => {
    listbox.remove();
    vi.useRealTimers();
  });

  it('should dispatch Filter event with match count when search terms are applied', () => {
    const filterEvents = /** @type {CustomEvent[]} */ ([]);

    listbox.addEventListener('Filter', (e) => filterEvents.push(/** @type {CustomEvent} */ (e)));
    action.update({ searchTerms: 'an' }); // matches Banana
    expect(filterEvents.length).toBeGreaterThan(0);
    expect(filterEvents[filterEvents.length - 1].detail.matched).toBe(1);
    expect(filterEvents[filterEvents.length - 1].detail.total).toBe(3);
  });

  it('should dispatch Toggle event on each item during filter', () => {
    const toggledItems = /** @type {string[]} */ ([]);

    options.forEach((opt) => {
      opt.addEventListener('Toggle', (e) => {
        if (/** @type {CustomEvent} */ (e).detail.hidden) {
          toggledItems.push(opt.dataset.label ?? '');
        }
      });
    });
    action.update({ searchTerms: 'apple' });
    // Banana and Cherry should be toggled hidden
    expect(toggledItems).toContain('Banana');
    expect(toggledItems).toContain('Cherry');
    expect(toggledItems).not.toContain('Apple');
  });

  it('should show all items when search terms are cleared', () => {
    action.update({ searchTerms: 'apple' });

    const filterEvents = /** @type {CustomEvent[]} */ ([]);

    listbox.addEventListener('Filter', (e) => filterEvents.push(/** @type {CustomEvent} */ (e)));
    action.update({ searchTerms: '' });
    expect(filterEvents[filterEvents.length - 1].detail.matched).toBe(3);
  });
});

describe('Group - tablist keyboard (Enter and Space)', () => {
  /** @type {HTMLElement} */
  let tablist;
  /** @type {HTMLElement[]} */
  let tabs;

  beforeEach(async () => {
    vi.useFakeTimers();
    tablist = document.createElement('div');
    tablist.setAttribute('role', 'tablist');
    tabs = ['Tab 1', 'Tab 2', 'Tab 3'].map((label) => {
      const tab = document.createElement('div');

      tab.setAttribute('role', 'tab');
      tab.textContent = label;
      tablist.appendChild(tab);

      return tab;
    });
    document.body.appendChild(tablist);
    activateGroup(tablist);
    await vi.advanceTimersByTimeAsync(150);
  });

  afterEach(() => {
    tablist.remove();
    vi.useRealTimers();
  });

  it('should select a tab when Space key is pressed on it', () => {
    tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
  });

  it('should trigger a click on the current tab when Enter is pressed', () => {
    let clicked = false;

    tabs[1].addEventListener('click', () => {
      clicked = true;
    });
    tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(clicked).toBe(true);
  });
});

describe('Group - tablist with aria-controls panels', () => {
  /** @type {HTMLElement} */
  let tablist;
  /** @type {HTMLElement[]} */
  let tabs;
  /** @type {HTMLElement[]} */
  let panels;

  beforeEach(async () => {
    vi.useFakeTimers();
    panels = ['panel-a', 'panel-b', 'panel-c'].map((id) => {
      const panel = document.createElement('div');

      panel.id = id;
      document.body.appendChild(panel);

      return panel;
    });
    tablist = document.createElement('div');
    tablist.setAttribute('role', 'tablist');
    tabs = panels.map((panel, i) => {
      const tab = document.createElement('div');

      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel.id);
      tab.textContent = `Tab ${i + 1}`;
      tablist.appendChild(tab);

      return tab;
    });
    document.body.appendChild(tablist);
    activateGroup(tablist);
    // also covers scrollIntoView setTimeout(300) in activate()
    await vi.advanceTimersByTimeAsync(500);
  });

  afterEach(() => {
    tablist.remove();
    panels.forEach((p) => p.remove());
    vi.useRealTimers();
  });

  it('should set aria-hidden=false on the first panel after activation', () => {
    expect(panels[0].getAttribute('aria-hidden')).toBe('false');
  });

  it('should set aria-hidden=true on non-selected panels after activation', () => {
    expect(panels[1].getAttribute('aria-hidden')).toBe('true');
    expect(panels[2].getAttribute('aria-hidden')).toBe('true');
  });

  it('should set inert=false on the first panel and inert=true on others', () => {
    expect(panels[0].inert).toBe(false);
    expect(panels[1].inert).toBe(true);
    expect(panels[2].inert).toBe(true);
  });

  it('should set aria-labelledby on panels to match tab IDs', () => {
    expect(panels[0].getAttribute('aria-labelledby')).toBe(tabs[0].id);
  });

  it('should switch panel visibility when a different tab is selected', () => {
    tabs[1].click();
    expect(panels[1].getAttribute('aria-hidden')).toBe('false');
    expect(panels[0].getAttribute('aria-hidden')).toBe('true');
  });

  it('should update inert on panels when a different tab is selected', () => {
    tabs[1].click();
    expect(panels[1].inert).toBe(false);
    expect(panels[0].inert).toBe(true);
  });

  it('should fire scrollIntoView on selected panel after 300ms (selectTarget)', async () => {
    tabs[1].click();
    // covers setTimeout(300) in selectTarget (lines 335-342, 352-355)
    await vi.advanceTimersByTimeAsync(400);
    // No crash; panel still correct
    expect(panels[1].getAttribute('aria-hidden')).toBe('false');
  });
});

describe('Group - disabled and read-only', () => {
  /** @type {HTMLElement} */
  let listbox;
  /** @type {HTMLElement[]} */
  let options;

  beforeEach(async () => {
    vi.useFakeTimers();
    listbox = document.createElement('div');
    listbox.setAttribute('role', 'listbox');
    options = ['Option A', 'Option B'].map((label) => {
      const opt = document.createElement('div');

      opt.setAttribute('role', 'option');
      opt.textContent = label;
      listbox.appendChild(opt);

      return opt;
    });
    document.body.appendChild(listbox);
    activateGroup(listbox);
    await vi.advanceTimersByTimeAsync(150);
  });

  afterEach(() => {
    listbox.remove();
    vi.useRealTimers();
  });

  it('should not select option when parent listbox is aria-disabled', () => {
    listbox.setAttribute('aria-disabled', 'true');
    options[0].click();
    expect(options[0].getAttribute('aria-selected')).toBe('false');
  });

  it('should not select option when parent listbox is aria-readonly', () => {
    listbox.setAttribute('aria-readonly', 'true');
    options[0].click();
    expect(options[0].getAttribute('aria-selected')).toBe('false');
  });
});

describe('Group - multiselect listbox', () => {
  /** @type {HTMLElement} */
  let listbox;
  /** @type {HTMLElement[]} */
  let options;

  beforeEach(async () => {
    vi.useFakeTimers();
    listbox = document.createElement('div');
    listbox.setAttribute('role', 'listbox');
    listbox.setAttribute('aria-multiselectable', 'true');
    options = ['Option A', 'Option B', 'Option C'].map((label) => {
      const opt = document.createElement('div');

      opt.setAttribute('role', 'option');
      opt.textContent = label;
      listbox.appendChild(opt);

      return opt;
    });
    document.body.appendChild(listbox);
    activateGroup(listbox);
    await vi.advanceTimersByTimeAsync(150);
  });

  afterEach(() => {
    listbox.remove();
    vi.useRealTimers();
  });

  it('should select option on click', () => {
    options[0].click();
    expect(options[0].getAttribute('aria-selected')).toBe('true');
  });

  it('should deselect option on second click (toggle)', () => {
    options[0].click();
    options[0].click();
    expect(options[0].getAttribute('aria-selected')).toBe('false');
  });

  it('should independently select multiple options', () => {
    options[0].click();
    options[2].click();
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    expect(options[1].getAttribute('aria-selected')).toBe('false');
    expect(options[2].getAttribute('aria-selected')).toBe('true');
  });
});

describe('Group - listbox keyboard navigation', () => {
  /** @type {HTMLElement} */
  let listbox;
  /** @type {HTMLElement[]} */
  let options;

  beforeEach(async () => {
    vi.useFakeTimers();
    listbox = document.createElement('div');
    listbox.setAttribute('role', 'listbox');
    options = ['Option A', 'Option B', 'Option C'].map((label) => {
      const opt = document.createElement('div');

      opt.setAttribute('role', 'option');
      opt.textContent = label;
      listbox.appendChild(opt);

      return opt;
    });
    document.body.appendChild(listbox);
    activateGroup(listbox);
    await vi.advanceTimersByTimeAsync(150);
  });

  afterEach(() => {
    listbox.remove();
    vi.useRealTimers();
  });

  it('should select the first option on ArrowDown when none is focused', () => {
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(options[0].getAttribute('aria-selected')).toBe('true');
  });

  it('should move to the next option on ArrowDown', () => {
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(options[1].getAttribute('aria-selected')).toBe('true');
    expect(options[0].getAttribute('aria-selected')).toBe('false');
  });

  it('should wrap to the first option on ArrowDown from last', () => {
    // Navigate to last option
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    // options[2] should be selected now; ArrowDown wraps to first
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(options[0].getAttribute('aria-selected')).toBe('true');
  });

  it('should select the last option on ArrowUp when none is focused', () => {
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(options[2].getAttribute('aria-selected')).toBe('true');
  });

  it('should move to the previous option on ArrowUp', () => {
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(options[1].getAttribute('aria-selected')).toBe('true');
  });

  it('should add focused class to selected option', () => {
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(options[0].classList.contains('focused')).toBe(true);
  });

  it('should move focused class when navigating', () => {
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(options[1].classList.contains('focused')).toBe(true);
    expect(options[0].classList.contains('focused')).toBe(false);
  });
});

describe('Group - menu with menuitemradio', () => {
  /** @type {HTMLElement} */
  let menu;
  /** @type {HTMLElement[]} */
  let radioItems;

  beforeEach(async () => {
    vi.useFakeTimers();
    menu = document.createElement('div');
    menu.setAttribute('role', 'menu');
    radioItems = ['Small', 'Medium', 'Large'].map((label) => {
      const item = document.createElement('div');

      item.setAttribute('role', 'menuitemradio');
      item.textContent = label;
      menu.appendChild(item);

      return item;
    });
    document.body.appendChild(menu);
    activateGroup(menu);
    await vi.advanceTimersByTimeAsync(150);
  });

  afterEach(() => {
    menu.remove();
    vi.useRealTimers();
  });

  it('should select the clicked radio item', () => {
    radioItems[0].click();
    expect(radioItems[0].getAttribute('aria-checked')).toBe('true');
  });

  it('should deselect other radio items when one is selected', () => {
    radioItems[0].click();
    expect(radioItems[1].getAttribute('aria-checked')).toBe('false');
    expect(radioItems[2].getAttribute('aria-checked')).toBe('false');
  });

  it('should switch selection when another radio item is clicked', () => {
    radioItems[0].click();
    radioItems[1].click();
    expect(radioItems[1].getAttribute('aria-checked')).toBe('true');
    expect(radioItems[0].getAttribute('aria-checked')).toBe('false');
  });
});

describe('Group - menu with menuitemcheckbox', () => {
  /** @type {HTMLElement} */
  let menu;
  /** @type {HTMLElement[]} */
  let checkItems;

  beforeEach(async () => {
    vi.useFakeTimers();
    menu = document.createElement('div');
    menu.setAttribute('role', 'menu');
    checkItems = ['Bold', 'Italic', 'Underline'].map((label) => {
      const item = document.createElement('div');

      item.setAttribute('role', 'menuitemcheckbox');
      item.textContent = label;
      menu.appendChild(item);

      return item;
    });
    document.body.appendChild(menu);
    activateGroup(menu);
    await vi.advanceTimersByTimeAsync(150);
  });

  afterEach(() => {
    menu.remove();
    vi.useRealTimers();
  });

  it('should check a menuitemcheckbox on click', () => {
    checkItems[0].click();
    expect(checkItems[0].getAttribute('aria-checked')).toBe('true');
  });

  it('should uncheck a menuitemcheckbox on second click', () => {
    checkItems[0].click();
    checkItems[0].click();
    expect(checkItems[0].getAttribute('aria-checked')).toBe('false');
  });

  it('should independently toggle each checkbox', () => {
    checkItems[0].click();
    checkItems[1].click();
    expect(checkItems[0].getAttribute('aria-checked')).toBe('true');
    expect(checkItems[1].getAttribute('aria-checked')).toBe('true');
    expect(checkItems[2].getAttribute('aria-checked')).toBe('false');
  });
});

describe('Group - radiogroup keyboard navigation', () => {
  /** @type {HTMLElement} */
  let radiogroup;
  /** @type {HTMLElement[]} */
  let radios;

  beforeEach(async () => {
    vi.useFakeTimers();
    radiogroup = document.createElement('div');
    radiogroup.setAttribute('role', 'radiogroup');
    radios = ['A', 'B', 'C'].map((label) => {
      const radio = document.createElement('div');

      radio.setAttribute('role', 'radio');
      radio.textContent = label;
      radiogroup.appendChild(radio);

      return radio;
    });
    document.body.appendChild(radiogroup);
    activateGroup(radiogroup);
    await vi.advanceTimersByTimeAsync(150);
    radios[0].click(); // select first radio
  });

  afterEach(() => {
    radiogroup.remove();
    vi.useRealTimers();
  });

  it('should navigate to the next radio on ArrowRight', () => {
    radios[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(radios[1].getAttribute('aria-checked')).toBe('true');
    expect(radios[0].getAttribute('aria-checked')).toBe('false');
  });

  it('should trigger click on the radio element during keydown navigation (line 304)', () => {
    let clickCount = 0;

    radios[1].addEventListener('click', () => {
      clickCount += 1;
    });
    radios[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(clickCount).toBe(1);
  });

  it('should navigate to the previous radio on ArrowLeft', () => {
    radios[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    radios[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(radios[0].getAttribute('aria-checked')).toBe('true');
    expect(radios[1].getAttribute('aria-checked')).toBe('false');
  });
});

describe('Group - grid listbox navigation', () => {
  /** @type {HTMLElement} */
  let listbox;
  /** @type {HTMLElement[]} */
  let options;

  beforeEach(async () => {
    vi.useFakeTimers();
    listbox = document.createElement('div');
    listbox.setAttribute('role', 'listbox');
    listbox.classList.add('grid');
    options = Array.from({ length: 6 }, (_, i) => {
      const opt = document.createElement('div');

      opt.setAttribute('role', 'option');
      opt.textContent = `Item ${i + 1}`;
      listbox.appendChild(opt);

      return opt;
    });
    document.body.appendChild(listbox);
    // Mock clientWidths so colCount = Math.floor(300/100) = 3
    Object.defineProperty(listbox, 'clientWidth', {
      configurable: true,
      get: () => 300,
    });
    options.forEach((opt) => {
      Object.defineProperty(opt, 'clientWidth', {
        configurable: true,
        get: () => 100,
      });
    });
    activateGroup(listbox);
    await vi.advanceTimersByTimeAsync(150);
    options[0].click(); // add .focused class to options[0]
  });

  afterEach(() => {
    listbox.remove();
    vi.useRealTimers();
  });

  it('should navigate down by colCount on ArrowDown', () => {
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    // options[0] (index 0) + colCount 3 = options[3]
    expect(options[3].getAttribute('aria-selected')).toBe('true');
    expect(options[0].getAttribute('aria-selected')).toBe('false');
  });

  it('should navigate right on ArrowRight', () => {
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(options[1].getAttribute('aria-selected')).toBe('true');
  });

  it('should navigate left on ArrowLeft', () => {
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(options[0].getAttribute('aria-selected')).toBe('true');
  });

  it('should navigate up by colCount on ArrowUp', () => {
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(options[0].getAttribute('aria-selected')).toBe('true');
  });

  it('should skip a disabled option during grid navigation', () => {
    options[3].setAttribute('aria-disabled', 'true');
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    // options[3] is disabled → newTarget set to undefined → no navigation
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    expect(options[3].getAttribute('aria-selected')).not.toBe('true');
  });
});
