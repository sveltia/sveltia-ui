import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import EmojiAutocompleteFixture from './emoji-autocomplete-fixture.test.svelte';
import EmojiAutocomplete from './emoji-autocomplete.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * Get the suggestion list.
 * @returns {HTMLElement | null} Element.
 */
const getList = () => document.querySelector('.sui.emoji-suggestions');

/**
 * Render the fixture and type the given text into the field.
 * @param {string} text Text to type.
 * @param {ComponentProps<typeof EmojiAutocompleteFixture>} [props] Props.
 * @returns {Promise<HTMLInputElement | HTMLTextAreaElement>} The field.
 */
const type = async (text, props = {}) => {
  const screen = await render(EmojiAutocompleteFixture, props);
  const field = screen.getByRole('textbox', { name: 'Field' });

  await field.click();
  await userEvent.keyboard(text);

  return /** @type {HTMLInputElement | HTMLTextAreaElement} */ (field.element());
};

describe('EmojiAutocomplete (text field)', () => {
  it('advertises the autocomplete on the field', async () => {
    const screen = await render(EmojiAutocompleteFixture);
    const field = screen.getByRole('textbox', { name: 'Field' });

    await expect.element(field).toHaveAttribute('aria-autocomplete', 'list');
    await expect.element(field).toHaveAttribute('aria-haspopup', 'listbox');
    expect(field.element().hasAttribute('aria-controls')).toBe(false);

    const bare = await render(EmojiAutocompleteFixture, { attached: false });

    expect(bare.container.querySelector('input')?.hasAttribute('aria-autocomplete')).toBe(false);
  });

  it('shows suggestions for a shortcode, and points the field at the highlighted one', async () => {
    const field = await type('Hello :smi');

    const list = /** @type {HTMLElement} */ (
      await vi.waitFor(() => {
        const element = getList();

        expect(element).not.toBeNull();

        return element;
      })
    );

    expect(list.getAttribute('role')).toBe('listbox');
    expect(list.getAttribute('aria-label')).toBe('Emoji Suggestions');
    expect(list.matches(':popover-open')).toBe(true);
    expect(list.style.left).not.toBe('');

    const options = list.querySelectorAll('[role="option"]');

    expect(options.length).toBeGreaterThan(1);
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    expect(options[0].querySelector('.name')?.textContent).toMatch(/^:smi/);
    expect(field.getAttribute('aria-controls')).toBe(list.id);
    expect(field.getAttribute('aria-activedescendant')).toBe(options[0].id);
  });

  it('does not suggest without a colon, or right after a word', async () => {
    await type('smile');
    expect(getList()).toBeNull();
    await userEvent.keyboard(' a:smile');
    expect(getList()).toBeNull();
  });

  it('navigates the list with the arrow keys and inserts with Enter', async () => {
    const field = await type(':smi');

    await vi.waitFor(() => {
      expect(getList()).not.toBeNull();
    });

    const options = /** @type {HTMLElement[]} */ ([
      ...(getList()?.querySelectorAll('[role="option"]') ?? []),
    ]);

    const second = options[1].querySelector('.emoji')?.textContent;

    await userEvent.keyboard('{ArrowDown}');
    expect(options[1].getAttribute('aria-selected')).toBe('true');
    expect(field.getAttribute('aria-activedescendant')).toBe(options[1].id);
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    // Wraps around to the last one
    expect(options.at(-1)?.getAttribute('aria-selected')).toBe('true');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    expect(field.value).toBe(`${second} `);
    expect(getList()).toBeNull();
    expect(field.hasAttribute('aria-controls')).toBe(false);
    // The caret ends up after the inserted emoji
    expect(field.selectionStart).toBe(field.value.length);
  });

  it('inserts with Tab as well, without a trailing space before existing text', async () => {
    const field = await type('a :smi b');

    field.setSelectionRange(6, 6);
    field.dispatchEvent(new Event('mouseup', { bubbles: true }));
    await vi.waitFor(() => {
      expect(getList()).not.toBeNull();
    });

    const first = getList()?.querySelector('.emoji')?.textContent;

    await userEvent.keyboard('{Tab}');
    expect(field.value).toBe(`a ${first} b`);
    expect(document.activeElement).toBe(field);
  });

  it('inserts with a click, keeping the focus in the field', async () => {
    const field = await type(':smi');

    await vi.waitFor(() => {
      expect(getList()).not.toBeNull();
    });

    const options = /** @type {HTMLElement[]} */ ([
      ...(getList()?.querySelectorAll('[role="option"]') ?? []),
    ]);

    const third = options[2].querySelector('.emoji')?.textContent;

    options[2].dispatchEvent(new MouseEvent('mouseenter'));
    await vi.waitFor(() => {
      expect(options[2].getAttribute('aria-selected')).toBe('true');
    });
    options[2].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    expect(field.value).toBe(`${third} `);
    expect(document.activeElement).toBe(field);
  });

  it('dismisses the list with Escape until another shortcode is typed', async () => {
    const field = await type(':smi');

    await vi.waitFor(() => {
      expect(getList()).not.toBeNull();
    });
    await userEvent.keyboard('{Escape}');
    expect(getList()).toBeNull();
    expect(field.value).toBe(':smi');
    // Keep typing the same shortcode: still dismissed
    await userEvent.keyboard('l');
    expect(getList()).toBeNull();
    // A new shortcode brings the list back
    await userEvent.keyboard(' :tad');
    await vi.waitFor(() => {
      expect(getList()).not.toBeNull();
    });
  });

  it('closes the list when the field loses the focus or the user presses elsewhere', async () => {
    const field = await type(':smi');

    await vi.waitFor(() => {
      expect(getList()).not.toBeNull();
    });
    field.blur();
    await vi.waitFor(() => {
      expect(getList()).toBeNull();
    });

    await field.focus();
    field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    await vi.waitFor(() => {
      expect(getList()).not.toBeNull();
    });
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await vi.waitFor(() => {
      expect(getList()).toBeNull();
    });
  });

  it('does not suggest in a read-only field, nor while text is selected', async () => {
    const screen = await render(EmojiAutocompleteFixture);

    const field = /** @type {HTMLInputElement} */ (
      screen.getByRole('textbox', { name: 'Field' }).element()
    );

    field.value = ':smi';
    field.readOnly = true;
    field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    expect(getList()).toBeNull();

    field.readOnly = false;
    field.focus();
    field.setSelectionRange(1, 4);
    field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    expect(getList()).toBeNull();

    field.setSelectionRange(4, 4);
    field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    await vi.waitFor(() => {
      expect(getList()).not.toBeNull();
    });
  });

  it('gives up on an insertion when the shortcode has moved', async () => {
    const field = await type(':smi');

    await vi.waitFor(() => {
      expect(getList()).not.toBeNull();
    });
    field.value = 'moved';
    await userEvent.keyboard('{Enter}');
    expect(field.value).toBe('moved');
    expect(getList()).toBeNull();
  });

  it('falls back to setRangeText when execCommand is unavailable', async () => {
    const execCommand = vi.spyOn(document, 'execCommand').mockImplementation(() => {
      throw new Error('Not supported');
    });

    const field = await type(':smi');
    const oninput = vi.fn();

    field.addEventListener('input', oninput);
    await vi.waitFor(() => {
      expect(getList()).not.toBeNull();
    });

    const first = getList()?.querySelector('.emoji')?.textContent;

    await userEvent.keyboard('{Enter}');
    expect(field.value).toBe(`${first} `);
    expect(oninput).toHaveBeenCalledOnce();
    execCommand.mockRestore();
  });

  it('does nothing without a field to attach to', async () => {
    const screen = await render(EmojiAutocomplete);

    expect(screen.container.querySelector('*')).toBeNull();
  });

  it('works with a text area, and not with a disabled field', async () => {
    const field = await type('Line\n:tad', { multiline: true });

    await vi.waitFor(() => {
      expect(getList()).not.toBeNull();
    });
    await userEvent.keyboard('{Enter}');
    expect(field.value).toMatch(/^Line\n🎉 $/u);

    await render(EmojiAutocompleteFixture, { disabled: true });
    expect(getList()).toBeNull();
  });
});
