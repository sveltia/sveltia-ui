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
      reporter: ['text', 'json-summary', 'json'],
    },
    silent: true,
  },
});
