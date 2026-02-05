/// <reference types="vitest/config" />

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

/** @type {import('vite').UserConfig} */
export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/lib/{components,services}/**/*.test.js'],
    coverage: {
      include: ['src/lib/{components,services}/**/*.js'],
      reporter: ['text'],
    },
    silent: true,
  },
});
