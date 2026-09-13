/// <reference types="vitest/config" />

import yaml from '@rollup/plugin-yaml';
import { sveltekit } from '@sveltejs/kit/vite';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vite';

/** @type {import('vite').UserConfig} */
export default defineConfig({
  plugins: [sveltekit(), yaml()],
  // Resolve Svelte to its client build under Vitest so tests can mount components
  resolve: process.env.VITEST ? { conditions: ['browser'] } : {},
  test: {
    coverage: {
      include: ['src/lib/{components,services}/**/*.{js,svelte}'],
      exclude: [
        // Test fixtures
        '**/*.test.svelte',
        // Build-time inputs rather than library runtime code: `engine-entry.js` is bundled into
        // `dist/shiki-engine.js` by esbuild and never imported, and `generated.js` and `version.js`
        // are generated
        '**/text-editor/shiki/engine-entry.js',
        '**/text-editor/shiki/generated.js',
        '**/text-editor/shiki/version.js',
      ],
      reporter: ['text', 'json-summary', 'json'],
    },
    silent: true,
    projects: [
      {
        // Unit tests for plain modules, run in Node with a simulated DOM
        extends: true,
        test: {
          name: 'unit',
          environment: 'happy-dom',
          include: ['src/lib/{components,services}/**/*.test.js'],
          exclude: ['src/lib/**/*.svelte.test.js'],
        },
      },
      {
        // Component tests, run in a real browser so layout, transitions and the top layer behave
        // as they do for users. The `.svelte.test.js` suffix also enables runes in the test files.
        extends: true,
        test: {
          name: 'browser',
          include: ['src/lib/{components,services}/**/*.svelte.test.js'],
          setupFiles: ['./src/lib/test-utils/setup.js'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
