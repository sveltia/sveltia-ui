/// <reference types="vitest/config" />

import yaml from '@rollup/plugin-yaml';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

/** @type {import('vite').UserConfig} */
export default defineConfig({
  plugins: [sveltekit(), yaml()],
  test: {
    environment: 'happy-dom',
    include: ['src/lib/{components,services}/**/*.test.js'],
    coverage: {
      include: ['src/lib/{components,services}/**/*.js'],
      exclude: [
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
  },
});
