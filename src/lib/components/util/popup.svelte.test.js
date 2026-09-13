import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PopupFixture from './popup-fixture.test.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * Get the popup content element.
 * @returns {HTMLElement | null} Element.
 */
const getContent = () => document.querySelector('dialog.popup .content');

/**
 * Render the fixture and open the popup through its anchor, the way a user does. The popup can’t
 * start out open: the prop is synced from the popup service, which starts closed, as soon as the
 * anchor is available.
 * @param {ComponentProps<typeof PopupFixture>} props Props.
 * @returns {Promise<Awaited<ReturnType<typeof render<typeof PopupFixture>>>>} Rendered fixture.
 */
const renderOpen = async (props) => {
  const screen = await render(PopupFixture, props);

  await screen.getByRole('button', { name: 'Anchor' }).click();
  await vi.waitFor(() => {
    expect(getContent()?.checkVisibility()).toBe(true);
  });

  return screen;
};

describe('Popup', () => {
  it('opens when the anchor is clicked, and closes when clicked again', async () => {
    /** @type {ComponentProps<typeof PopupFixture>} */
    const props = $state({ open: false });
    const screen = await render(PopupFixture, props);
    const anchor = screen.getByRole('button', { name: 'Anchor' });

    expect(getContent()).toBeNull();
    await expect.element(anchor).toHaveAttribute('aria-expanded', 'false');
    await anchor.click();
    await expect.element(anchor).toHaveAttribute('aria-expanded', 'true');
    expect(props.open).toBe(true);
    await vi.waitFor(() => {
      expect(getContent()?.checkVisibility()).toBe(true);
    });

    const content = /** @type {HTMLElement} */ (getContent());

    // Positioned by the popup service once the content is in the DOM tree
    await vi.waitFor(() => {
      expect(content.style.inset).not.toBe('');
    });
    expect(content.classList.contains('menu')).toBe(true);
    // The anchor points at the content, which is what identifies the popup
    expect(content.id).toBeTruthy();
    expect(anchor.element().getAttribute('aria-controls')).toBe(content.id);

    // The modal backdrop covers the anchor while the popup is open, so a real click would land on
    // the backdrop; the anchor’s own toggle is what a keyboard activation goes through
    /** @type {HTMLElement} */ (anchor.element()).click();
    await vi.waitFor(() => {
      expect(props.open).toBe(false);
    });
    await vi.waitFor(() => {
      expect(getContent()).toBeNull();
    });
    await expect.element(anchor).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens and closes through the bound prop', async () => {
    /** @type {ComponentProps<typeof PopupFixture>} */
    const props = $state({ open: false });

    await render(PopupFixture, props);
    props.open = true;
    await vi.waitFor(() => {
      expect(getContent()?.checkVisibility()).toBe(true);
    });
    props.open = false;
    await vi.waitFor(() => {
      expect(getContent()).toBeNull();
    });
  });

  it('moves the focus to the tab stop within the content', async () => {
    const onOpen = vi.fn();
    const screen = await render(PopupFixture, { onOpen });

    await screen.getByRole('button', { name: 'Anchor' }).click();
    await vi.waitFor(() => {
      expect(onOpen).toHaveBeenCalledOnce();
    });
    await vi.waitFor(() => {
      expect(document.activeElement?.classList.contains('item')).toBe(true);
    });
  });

  it('focuses the content itself when it has no focusable element', async () => {
    const screen = await render(PopupFixture, { withTabStop: false });

    await screen.getByRole('button', { name: 'Anchor' }).click();
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getContent());
    });
    expect(getContent()?.tabIndex).toBe(-1);
  });

  it('reports whether the content is hovered', async () => {
    /** @type {ComponentProps<typeof PopupFixture>} */
    const props = $state({ open: false, hovered: false });

    await renderOpen(props);

    const content = /** @type {HTMLElement} */ (getContent());

    content.dispatchEvent(new MouseEvent('mouseenter'));
    expect(props.hovered).toBe(true);
    content.dispatchEvent(new MouseEvent('mouseleave'));
    expect(props.hovered).toBe(false);
  });

  it('closes when the backdrop is clicked', async () => {
    /** @type {ComponentProps<typeof PopupFixture>} */
    const props = $state({ open: false });

    await renderOpen(props);
    /** @type {HTMLDialogElement} */ (
      /** @type {HTMLElement} */ (getContent()).closest('dialog')
    ).click();
    await vi.waitFor(() => {
      expect(props.open).toBe(false);
    });
  });

  it('closes with the Escape key', async () => {
    /** @type {ComponentProps<typeof PopupFixture>} */
    const props = $state({ open: false });

    await renderOpen(props);
    getContent()
      ?.closest('dialog')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await vi.waitFor(() => {
      expect(props.open).toBe(false);
    });
  });

  it('closes when a menu item within the content is clicked', async () => {
    /** @type {ComponentProps<typeof PopupFixture>} */
    const props = $state({ open: false });
    const screen = await renderOpen(props);

    await screen.getByRole('menuitem', { name: 'Item' }).click();
    await vi.waitFor(() => {
      expect(props.open).toBe(false);
    });
  });

  it('shows the backdrop on demand', async () => {
    /** @type {ComponentProps<typeof PopupFixture>} */
    const props = $state({ open: false, showBackdrop: true });

    await renderOpen(props);
    expect(getContent()?.closest('dialog')?.classList.contains('backdrop')).toBe(true);
  });

  it('does without a content type when the anchor declares none', async () => {
    /** @type {ComponentProps<typeof PopupFixture>} */
    const props = $state({ open: false, hasPopup: false });

    await renderOpen(props);
    expect(getContent()?.classList.contains('menu')).toBe(false);
    expect(getContent()?.classList.contains('undefined')).toBe(false);
  });

  it('does not mark the content as touch-optimized on a device with a fine pointer', async () => {
    /** @type {ComponentProps<typeof PopupFixture>} */
    const props = $state({ open: false, touchOptimized: true });

    await renderOpen(props);
    expect(getContent()?.classList.contains('touch')).toBe(false);
    expect(getContent()?.closest('dialog')?.classList.contains('backdrop')).toBe(false);
  });

  it('marks the content as touch-optimized on a coarse pointer device', async () => {
    const matchMedia = vi.spyOn(window, 'matchMedia');

    matchMedia.mockImplementation(
      (query) =>
        /** @type {MediaQueryList} */ (
          /** @type {unknown} */ ({
            matches: query.includes('coarse'),
            media: query,
            /**
             * Ignore listeners.
             */
            addEventListener: () => {},
            /**
             * Ignore listeners.
             */
            removeEventListener: () => {},
          })
        ),
    );

    /** @type {ComponentProps<typeof PopupFixture>} */
    const props = $state({ open: false, touchOptimized: true });

    await renderOpen(props);
    expect(getContent()?.classList.contains('touch')).toBe(true);
    expect(getContent()?.closest('dialog')?.classList.contains('backdrop')).toBe(true);
    matchMedia.mockRestore();
  });
});
