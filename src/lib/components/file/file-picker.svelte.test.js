import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FilePicker from './file-picker.svelte';

it('renders a hidden file input with the given attributes', async () => {
  const screen = await render(FilePicker, { accept: 'image/*', multiple: true });
  const input = /** @type {HTMLInputElement} */ (screen.container.querySelector('input'));

  expect(input.type).toBe('file');
  expect(input.hidden).toBe(true);
  expect(input.accept).toBe('image/*');
  expect(input.multiple).toBe(true);
  expect(input.classList.contains('file-picker')).toBe(true);
});

it('opens the picker by clicking the input', async () => {
  const screen = await render(FilePicker);
  const input = /** @type {HTMLInputElement} */ (screen.container.querySelector('input'));
  const click = vi.spyOn(input, 'click').mockImplementation(() => {});

  screen.component.open();
  expect(click).toHaveBeenCalledOnce();
});

it('reports the selected files', async () => {
  const onSelect = vi.fn();
  const screen = await render(FilePicker, { multiple: true, onSelect });
  const input = /** @type {HTMLInputElement} */ (screen.container.querySelector('input'));
  const transfer = new DataTransfer();
  const first = new File(['a'], 'a.txt', { type: 'text/plain' });
  const second = new File(['b'], 'b.txt', { type: 'text/plain' });

  transfer.items.add(first);
  transfer.items.add(second);
  input.files = transfer.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  expect(onSelect).toHaveBeenCalledOnce();
  expect(onSelect.mock.calls[0][0].files).toEqual([first, second]);
  expect(onSelect.mock.calls[0][0].file).toBe(first);
});

it('reports a cancelled picker without letting the event escape', async () => {
  const onCancel = vi.fn();
  const outer = vi.fn();
  const screen = await render(FilePicker, { onCancel });
  const input = /** @type {HTMLInputElement} */ (screen.container.querySelector('input'));

  screen.container.addEventListener('cancel', outer);
  input.dispatchEvent(new Event('cancel', { bubbles: true }));
  expect(onCancel).toHaveBeenCalledOnce();
  expect(outer).not.toHaveBeenCalled();
});
