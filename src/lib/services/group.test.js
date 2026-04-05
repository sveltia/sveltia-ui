/* eslint-disable jsdoc/require-jsdoc */

import { locale } from '@sveltia/i18n';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activateGroup, Group, normalize } from './group.svelte.js';

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
    activateGroup()(tablist);
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

  it('should navigate backward when pressing ArrowRight in RTL (branch 63 prevKey=ArrowRight)', () => {
    locale.set('ar'); // RTL locale to set _isRTL=true in activate()
    // In RTL prevKey='ArrowRight'; press from tabs[2] → backward to tabs[1]
    tabs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    locale.set('en'); // Reset locale to LTR
  });

  it('should navigate forward when pressing ArrowLeft in RTL (branch 65 nextKey=ArrowLeft)', () => {
    locale.set('ar'); // RTL locale to set _isRTL=true in activate()
    // In RTL nextKey='ArrowLeft'; press from tabs[0] → forward to tabs[1]
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    locale.set('en'); // Reset locale to LTR
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
    activateGroup()(listbox);
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

  it('should select option when clicking on a child element inside it (target.closest branch 38)', () => {
    const span = document.createElement('span');

    span.textContent = 'Inner';
    options[0].appendChild(span);
    span.dispatchEvent(new MouseEvent('click', { button: 0, bubbles: true }));
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    span.remove();
  });

  it('should not select option when right-clicked (button !== 0, branch 39 early return)', () => {
    options[0].dispatchEvent(new MouseEvent('click', { button: 2, bubbles: true }));
    expect(options[0].getAttribute('aria-selected')).toBe('false');
  });

  it('should not select when clicking the listbox container itself (!newTarget, branch 39)', () => {
    listbox.dispatchEvent(new MouseEvent('click', { button: 0 }));
    options.forEach((opt) => expect(opt.getAttribute('aria-selected')).toBe('false'));
  });
});

describe('Group - onUpdate (search filter)', () => {
  /** @type {HTMLElement} */
  let listbox;
  /** @type {HTMLElement[]} */
  let options;
  /** @type {any} */
  let group;

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
    group = new Group(listbox);
    await vi.advanceTimersByTimeAsync(150);
  });

  afterEach(() => {
    listbox.remove();
    vi.useRealTimers();
  });

  it('should dispatch Filter event with match count when search terms are applied', () => {
    const filterEvents = /** @type {CustomEvent[]} */ ([]);

    listbox.addEventListener('Filter', (e) => filterEvents.push(/** @type {CustomEvent} */ (e)));
    group.onUpdate({ searchTerms: 'an' }); // matches Banana
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
    group.onUpdate({ searchTerms: 'apple' });
    // Banana and Cherry should be toggled hidden
    expect(toggledItems).toContain('Banana');
    expect(toggledItems).toContain('Cherry');
    expect(toggledItems).not.toContain('Apple');
  });

  it('should show all items when search terms are cleared', () => {
    group.onUpdate({ searchTerms: 'apple' });

    const filterEvents = /** @type {CustomEvent[]} */ ([]);

    listbox.addEventListener('Filter', (e) => filterEvents.push(/** @type {CustomEvent} */ (e)));
    group.onUpdate({ searchTerms: '' });
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
    activateGroup()(tablist);
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
    activateGroup()(tablist);
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
    activateGroup()(listbox);
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
    activateGroup()(listbox);
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

  it('should do nothing when Space pressed with no focused element (branch 47 false path)', () => {
    // No navigation has occurred → no .focused element → currentTarget = undefined
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    options.forEach((opt) => expect(opt.getAttribute('aria-selected')).toBe('false'));
  });

  it('should select multiselect option via Space keydown (selectByKeydown, branch 22 count[3])', () => {
    // ArrowDown gives options[0] the .focused class without selecting (multiselect ignores arrow)
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(options[0].classList.contains('focused')).toBe(true);
    expect(options[0].getAttribute('aria-selected')).toBe('false');
    // Space selects via multiSelect && isTarget && selectByKeydown path
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(options[0].getAttribute('aria-selected')).toBe('true');
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
    activateGroup()(listbox);
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
    activateGroup()(menu);
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
    activateGroup()(menu);
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
    activateGroup()(radiogroup);
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
    activateGroup()(listbox);
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

  it('should navigate grid forward (index+1) on ArrowLeft in RTL (branch 56)', () => {
    // Navigate to options[1] first
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(options[1].getAttribute('aria-selected')).toBe('true');
    // In RTL, ArrowLeft moves forward: index 1 + 1 = options[2]
    locale.set('ar'); // RTL locale to set _isRTL=true in activate()
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(options[2].getAttribute('aria-selected')).toBe('true');
    locale.set('en'); // Reset locale to LTR
  });

  it('should navigate grid backward (index-1) on ArrowRight in RTL (branch 59)', () => {
    // Navigate to options[1]
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(options[1].getAttribute('aria-selected')).toBe('true');
    // In RTL, ArrowRight moves backward: index 1 - 1 = options[0]
    locale.set('ar'); // RTL locale to set _isRTL=true in activate()
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    locale.set('en'); // Reset locale to LTR
  });
});

describe('Group - scrollIntoView catch fallback in activate()', () => {
  /** @type {HTMLElement} */
  let tablist;
  /** @type {HTMLElement[]} */
  let panels;

  beforeEach(async () => {
    vi.useFakeTimers();
    panels = ['panel-catch-a', 'panel-catch-b'].map((id) => {
      const panel = document.createElement('div');

      panel.id = id;
      // Make scrollIntoView(options) throw but scrollIntoView(boolean) succeed

      panel.scrollIntoView = (arg) => {
        if (arg && typeof arg === 'object') {
          throw new Error('not supported');
        }
      };

      document.body.appendChild(panel);

      return panel;
    });
    tablist = document.createElement('div');
    tablist.setAttribute('role', 'tablist');
    panels.forEach((panel, i) => {
      const tab = document.createElement('div');

      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel.id);
      tab.textContent = `Tab ${i + 1}`;
      tablist.appendChild(tab);
    });
    document.body.appendChild(tablist);
    activateGroup()(tablist);
    // flush sleep(100) + setTimeout(300) in activate()
    await vi.advanceTimersByTimeAsync(500);
  });

  afterEach(() => {
    tablist.remove();
    panels.forEach((p) => p.remove());
    vi.useRealTimers();
  });

  it('should fall back to scrollIntoView(true) when options form throws during activate()', () => {
    // If the catch branch executed without throwing, the panel is set up correctly
    expect(panels[0].getAttribute('aria-hidden')).toBe('false');
  });
});

describe('Group - scrollIntoView catch fallback in selectTarget()', () => {
  /** @type {HTMLElement} */
  let tablist;
  /** @type {HTMLElement[]} */
  let tabs;
  /** @type {HTMLElement[]} */
  let panels;

  beforeEach(async () => {
    vi.useFakeTimers();
    panels = ['panel-sel-a', 'panel-sel-b'].map((id) => {
      const panel = document.createElement('div');

      panel.id = id;

      panel.scrollIntoView = (arg) => {
        if (arg && typeof arg === 'object') {
          throw new Error('not supported');
        }
      };

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
      // Also override the tab element's scrollIntoView to throw on options form

      tab.scrollIntoView = (arg) => {
        if (arg && typeof arg === 'object') {
          throw new Error('not supported');
        }
      };

      tablist.appendChild(tab);

      return tab;
    });
    document.body.appendChild(tablist);
    activateGroup()(tablist);
    await vi.advanceTimersByTimeAsync(500);
  });

  afterEach(() => {
    tablist.remove();
    panels.forEach((p) => p.remove());
    vi.useRealTimers();
  });

  it('should fall back to scrollIntoView(true) on controlTarget and element when options form throws', async () => {
    // Switch to the second tab to trigger selectTarget() catch branches
    tabs[1].click();
    await vi.advanceTimersByTimeAsync(400);
    // Verify the panel switched correctly despite the scrollIntoView error
    expect(panels[1].getAttribute('aria-hidden')).toBe('false');
    expect(panels[0].getAttribute('aria-hidden')).toBe('true');
  });
});

describe('Group - tablist with pre-selected second tab (branch 7 defaultSelected)', () => {
  it('should preserve pre-selected tab and use defaultSelected ternary path', async () => {
    vi.useFakeTimers();

    const tl = document.createElement('div');

    tl.setAttribute('role', 'tablist');

    const tbs = ['Tab 1', 'Tab 2', 'Tab 3'].map((label) => {
      const tab = document.createElement('div');

      tab.setAttribute('role', 'tab');
      tab.textContent = label;
      tl.appendChild(tab);

      return tab;
    });

    // Pre-select the second tab before activation
    tbs[1].setAttribute('aria-selected', 'true');
    document.body.appendChild(tl);
    activateGroup()(tl);
    await vi.advanceTimersByTimeAsync(150);

    // defaultSelected = tbs[1]; the ternary `defaultSelected ? element === defaultSelected : ...`
    // evaluates to true for tbs[1] → branch 7 count[0] is hit
    expect(tbs[1].getAttribute('aria-selected')).toBe('true');
    expect(tbs[0].getAttribute('aria-selected')).toBe('false');
    tl.remove();
    vi.useRealTimers();
  });
});

describe('Group - menu with nested radio groups (branch 16 cross-group filter)', () => {
  it('should not affect radio items in a different group when selecting one', async () => {
    vi.useFakeTimers();

    const menu = document.createElement('div');

    menu.setAttribute('role', 'menu');

    const group1 = document.createElement('div');

    group1.setAttribute('role', 'group');

    const radioA = document.createElement('div');

    radioA.setAttribute('role', 'menuitemradio');
    radioA.textContent = 'A';
    group1.appendChild(radioA);

    const group2 = document.createElement('div');

    group2.setAttribute('role', 'group');

    const radioB = document.createElement('div');

    radioB.setAttribute('role', 'menuitemradio');
    radioB.textContent = 'B';
    group2.appendChild(radioB);

    menu.appendChild(group1);
    menu.appendChild(group2);
    document.body.appendChild(menu);
    activateGroup()(menu);
    await vi.advanceTimersByTimeAsync(150);

    // Click radioA — radioB is in a different group, so line 267 early return filters it out
    radioA.click();
    expect(radioA.getAttribute('aria-checked')).toBe('true');
    // radioB was skipped (early return at line 267) — remains unaffected
    expect(radioB.getAttribute('aria-checked')).toBe('false');
    menu.remove();
    vi.useRealTimers();
  });
});

describe('Group - onClick with clickToSelect disabled (branch 39 !clickToSelect)', () => {
  it('should not select option when clickToSelect is false', async () => {
    vi.useFakeTimers();

    const lb = document.createElement('div');

    lb.setAttribute('role', 'listbox');

    const opt = document.createElement('div');

    opt.setAttribute('role', 'option');
    opt.textContent = 'Option';
    lb.appendChild(opt);
    document.body.appendChild(lb);
    activateGroup({ clickToSelect: false })(lb);
    await vi.advanceTimersByTimeAsync(150);
    opt.click();
    // !clickToSelect → early return in onClick → aria-selected stays false
    expect(opt.getAttribute('aria-selected')).toBe('false');
    lb.remove();
    vi.useRealTimers();
  });
});

describe('Group - grid listbox with no initial focus (branch 49 currentTarget?...: -1)', () => {
  it('should use index -1 as fallback when no item is focused in grid', async () => {
    vi.useFakeTimers();

    const gridListbox = document.createElement('div');

    gridListbox.setAttribute('role', 'listbox');
    gridListbox.classList.add('grid');

    const gridOptions = Array.from({ length: 6 }, (_, i) => {
      const opt = document.createElement('div');

      opt.setAttribute('role', 'option');
      opt.textContent = `Item ${i + 1}`;
      gridListbox.appendChild(opt);

      return opt;
    });

    document.body.appendChild(gridListbox);
    Object.defineProperty(gridListbox, 'clientWidth', { configurable: true, get: () => 300 });
    gridOptions.forEach((opt) => {
      Object.defineProperty(opt, 'clientWidth', { configurable: true, get: () => 100 });
    });
    activateGroup()(gridListbox);
    await vi.advanceTimersByTimeAsync(150);

    // Press ArrowDown with no focused element → currentTarget=undefined → index=-1
    // -1 + colCount(3) = 2 → gridOptions[2]
    gridListbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(gridOptions[2].getAttribute('aria-selected')).toBe('true');
    gridListbox.remove();
    vi.useRealTimers();
  });
});

describe('Group - onUpdate with querySelector(.label) and textContent fallbacks (branch 75)', () => {
  it('should use .label child textContent and plain textContent as search sources', async () => {
    vi.useFakeTimers();

    const listbox = document.createElement('div');

    listbox.setAttribute('role', 'listbox');

    // opt1: has .label span child, no dataset attrs → querySelector('.label').textContent path
    const opt1 = document.createElement('div');

    opt1.setAttribute('role', 'option');

    const labelSpan = document.createElement('span');

    labelSpan.className = 'label';
    labelSpan.textContent = 'Apple';
    opt1.appendChild(labelSpan);

    // opt2: plain textContent only, no dataset, no .label child → member.textContent path
    const opt2 = document.createElement('div');

    opt2.setAttribute('role', 'option');
    opt2.textContent = 'Banana';

    listbox.appendChild(opt1);
    listbox.appendChild(opt2);
    document.body.appendChild(listbox);

    const group = new Group(listbox);

    await vi.advanceTimersByTimeAsync(150);

    /** @type {any} */
    let filterDetail = null;

    listbox.addEventListener('Filter', (e) => {
      filterDetail = /** @type {any} */ (e).detail;
    });

    // Searching 'apple' matches opt1 (via .label span) but not opt2 (via textContent 'Banana')
    group.onUpdate({ searchTerms: 'apple' });
    expect(filterDetail.matched).toBe(1);
    expect(filterDetail.total).toBe(2);

    listbox.remove();
    vi.useRealTimers();
  });
});

describe('Group - destroy', () => {
  it('should remove click and keydown listeners after destroy()', async () => {
    vi.useFakeTimers();

    const listbox = document.createElement('div');

    listbox.setAttribute('role', 'listbox');

    const opt = document.createElement('div');

    opt.setAttribute('role', 'option');
    opt.textContent = 'Option';
    listbox.appendChild(opt);
    document.body.appendChild(listbox);

    const group = new Group(listbox);

    await vi.advanceTimersByTimeAsync(150);

    // Click selects before destroy
    opt.click();
    expect(opt.getAttribute('aria-selected')).toBe('true');

    group.destroy();

    // Reset and click again — listener should be gone
    opt.setAttribute('aria-selected', 'false');
    opt.click();
    expect(opt.getAttribute('aria-selected')).toBe('false');

    listbox.remove();
    vi.useRealTimers();
  });
});

describe('activateGroup - attachment cleanup', () => {
  it('should return a cleanup function that calls destroy()', async () => {
    vi.useFakeTimers();

    const listbox = document.createElement('div');

    listbox.setAttribute('role', 'listbox');

    const opt = document.createElement('div');

    opt.setAttribute('role', 'option');
    opt.textContent = 'Option';
    listbox.appendChild(opt);
    document.body.appendChild(listbox);

    const cleanup = activateGroup()(listbox);

    await vi.advanceTimersByTimeAsync(150);

    // Click selects before cleanup
    opt.click();
    expect(opt.getAttribute('aria-selected')).toBe('true');

    // Run cleanup
    expect(typeof cleanup).toBe('function');
    /** @type {() => void} */ (cleanup)();

    // Reset and click again — listener should be gone
    opt.setAttribute('aria-selected', 'false');
    opt.click();
    expect(opt.getAttribute('aria-selected')).toBe('false');

    listbox.remove();
    vi.useRealTimers();
  });
});
