import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [sveltekit()],
  server: {
    fs: {
      allow: ['.svelte-kit', 'node_modules', 'src', 'package.json'],
    },
  },
};

export default config;
