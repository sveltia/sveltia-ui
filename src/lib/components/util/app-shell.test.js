import { afterEach, describe, expect, it } from 'vitest';
import { shouldAllowContextMenu } from './app-shell.js';

describe('shouldAllowContextMenu', () => {
  afterEach(() => {
    delete document.documentElement.dataset.env;
    document.body.innerHTML = '';
  });

  it('should block the menu on ordinary elements', () => {
    const div = document.createElement('div');
    const button = document.createElement('button');

    expect(shouldAllowContextMenu(div)).toBe(false);
    expect(shouldAllowContextMenu(button)).toBe(false);
    expect(shouldAllowContextMenu(null)).toBe(false);
    expect(shouldAllowContextMenu(document)).toBe(false);
  });

  it('should allow the menu on text fields', () => {
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');

    expect(shouldAllowContextMenu(input)).toBe(true);
    expect(shouldAllowContextMenu(textarea)).toBe(true);
  });

  it('should allow the menu within a rich text editor', () => {
    document.body.innerHTML =
      '<div role="textbox" contenteditable="true"><p><strong>text</strong></p></div>';

    expect(shouldAllowContextMenu(document.querySelector('strong'))).toBe(true);
  });

  it('should block the menu within a read-only textbox', () => {
    document.body.innerHTML = '<div role="textbox"><p><strong>text</strong></p></div>';

    expect(shouldAllowContextMenu(document.querySelector('strong'))).toBe(false);
  });

  it('should allow the menu anywhere in developer mode', () => {
    document.documentElement.dataset.env = 'dev';

    expect(shouldAllowContextMenu(document.createElement('div'))).toBe(true);
  });
});
