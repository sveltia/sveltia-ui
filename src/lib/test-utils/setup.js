/**
 * Vitest setup file for the browser project, loaded before every component test file. Component
 * tests render the same localized strings the library ships with, and are laid out with the same
 * stylesheet, so both are set up here once rather than in each test.
 *
 * The locales are registered directly rather than through `initLocales()`, because importing the
 * `i18n` service here would leave it cached with the real `@sveltia/i18n` bound to it, defeating
 * the mock in its own unit test. Every locale is registered, not just English, so a test can
 * switch to a right-to-left locale with `locale.set()`, which would otherwise fall back to English.
 */

import { addMessages, init } from '@sveltia/i18n';
import { afterEach } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
// Load the global stylesheet the components are laid out with (see the component for details)
import './core-styles.svelte';

const resources = import.meta.glob('../locales/*.yaml', { eager: true, import: 'default' });

Object.entries(resources).forEach(([path, strings]) => {
  const locale = /** @type {string} */ (path.match(/(?<locale>[^/]+)\.yaml$/)?.groups?.locale);

  addMessages(locale, { _sui: /** @type {Record<string, string>} */ (strings) });
});

init({ fallbackLocale: 'en-US', initialLocale: 'en-US' });

afterEach(() => {
  // Unmount whatever the test rendered, then clear anything a component has moved out of its
  // container and left behind, such as the shared popover base a `<Toast>` appends to `<body>`
  cleanup();
  document.body.replaceChildren();
  document.body.inert = false;
});
