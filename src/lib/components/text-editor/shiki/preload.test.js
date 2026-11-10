import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadCodeLanguage, loadCodeTheme, loadEngine } from './facade.js';
import { loadCodeHighlighter } from './preload.js';

vi.mock('./facade.js', () => ({
  isPlainLanguage: vi.fn((lang) => ['', 'plain', 'plaintext', 'text', 'txt'].includes(lang ?? '')),
  loadEngine: vi.fn(() => Promise.resolve()),
  loadCodeLanguage: vi.fn(() => Promise.resolve()),
  loadCodeTheme: vi.fn(() => Promise.resolve()),
  normalizeCodeLanguage: vi.fn((lang) => (lang === 'js' ? 'javascript' : lang)),
}));

vi.mock('./theme.js', () => ({
  getCodeTheme: vi.fn(() => 'github-light'),
}));

describe('loadCodeHighlighter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips loading the highlighter entirely for a plain language', async () => {
    await expect(loadCodeHighlighter('plain')).resolves.toBeUndefined();
    expect(loadEngine).not.toHaveBeenCalled();
    expect(loadCodeLanguage).not.toHaveBeenCalled();
  });

  it('loads the engine, grammar and theme for a highlighted language', async () => {
    await loadCodeHighlighter('javascript');
    expect(loadEngine).toHaveBeenCalled();
    expect(loadCodeLanguage).toHaveBeenCalledWith('javascript');
    expect(loadCodeTheme).toHaveBeenCalledWith('github-light');
  });

  it('resolves a language alias before loading the grammar', async () => {
    await loadCodeHighlighter('js');
    expect(loadCodeLanguage).toHaveBeenCalledWith('javascript');
  });

  it('resolves without throwing for an unsupported language', async () => {
    await expect(loadCodeHighlighter('nonexistent')).resolves.toBeUndefined();
    expect(loadCodeLanguage).toHaveBeenCalledWith('nonexistent');
  });

  it('rejects when the engine cannot be loaded', async () => {
    vi.mocked(loadEngine).mockRejectedValueOnce(new Error('offline'));

    await expect(loadCodeHighlighter('javascript')).rejects.toThrow('offline');
  });
});
