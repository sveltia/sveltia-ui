import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EMOJILIB_VERSION,
  getEmojiDataLoader,
  getEmojiDataURL,
  setEmojiDataLoader,
} from './loader.js';

const defaultLoader = getEmojiDataLoader();

describe('EMOJILIB_VERSION', () => {
  it('should match the installed emojilib, which the version is written out from', () => {
    // Read rather than imported: a JSON import would need an import attribute under Node, which is
    // exactly what `loader.js` avoids
    const { version } = JSON.parse(
      readFileSync('node_modules/emojilib/package.json', { encoding: 'utf8' }),
    );

    expect(EMOJILIB_VERSION).toBe(version);
  });
});

describe('getEmojiDataURL', () => {
  it('should point at the pinned emojilib version', () => {
    expect(EMOJILIB_VERSION).toMatch(/^\d+\.\d+\.\d+/);
    expect(getEmojiDataURL()).toBe(
      `https://unpkg.com/emojilib@${EMOJILIB_VERSION}/dist/emoji-en-US.json`,
    );
  });
});

describe('setEmojiDataLoader', () => {
  afterEach(() => {
    setEmojiDataLoader(defaultLoader);
    vi.unstubAllGlobals();
  });

  it('should replace the loader, so consumers can bundle or self-host the data', async () => {
    const data = { '🎉': ['party_popper'] };

    setEmojiDataLoader(async () => data);

    expect(await getEmojiDataLoader()()).toBe(data);
  });

  it('should fetch from the CDN by default', async () => {
    const data = { '🎉': ['party_popper'] };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(data), { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    expect(await getEmojiDataLoader()()).toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith(getEmojiDataURL(), expect.anything());
  });

  it('should throw on a failed response, so the caller can fall back', async () => {
    vi.stubGlobal('fetch', async () => new Response('', { status: 404 }));

    await expect(getEmojiDataLoader()()).rejects.toThrow('404');
  });
});
