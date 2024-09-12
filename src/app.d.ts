/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
  // interface Error {}
  // interface Locals {}
  // interface PageData {}
  // interface Platform {}
}

/**
 * Silence some import errors.
 * @see https://stackoverflow.com/q/64194571
 */
declare module '*.svelte' {
  import type { Component } from 'svelte';
  const component: Component;
  export default component;
}

/**
 * Add support for the Popover API
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
 */
interface HTMLElement {
  popover: 'auto' | 'manual';
  showPopover: Function;
}
