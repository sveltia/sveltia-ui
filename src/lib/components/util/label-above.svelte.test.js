import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LabelAbove from './label-above.svelte';

/**
 * Add a field to the page, outside the rendered component.
 * @param {string} html Markup of the field.
 * @returns {HTMLElement} Field.
 */
const addField = (html) => {
  const wrapper = document.createElement('div');

  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  return /** @type {HTMLElement} */ (wrapper.firstElementChild);
};

describe('LabelAbove', () => {
  it('labels a labelable field', async () => {
    const screen = await render(LabelAbove, { label: 'Title', for: 'title', id: 'title-label' });
    const label = screen.getByText('Title').element();

    expect(label.tagName).toBe('LABEL');
    expect(label.getAttribute('for')).toBe('title');
    expect(label.id).toBe('title-label');
  });

  it('focuses a field that isn’t labelable on a click', async () => {
    const field = addField('<div role="combobox" tabindex="0"></div>');
    const screen = await render(LabelAbove, { label: 'Role', getTarget: vi.fn(() => field) });

    expect(screen.getByText('Role').element().hasAttribute('for')).toBe(false);
    await screen.getByText('Role').click();
    expect(document.activeElement).toBe(field);
    field.parentElement?.remove();
  });

  it('leaves a disabled field alone', async () => {
    const field = addField('<div role="slider" tabindex="-1" aria-disabled="true"></div>');
    const screen = await render(LabelAbove, { label: 'Volume', getTarget: vi.fn(() => field) });

    await screen.getByText('Volume').click();
    expect(document.activeElement).not.toBe(field);
    field.parentElement?.remove();
  });

  it('does nothing on a click without a field to focus', async () => {
    const screen = await render(LabelAbove, { label: 'Tags', getTarget: vi.fn(() => null) });

    await screen.getByText('Tags').click();
    expect(document.activeElement).toBe(document.body);
  });
});
