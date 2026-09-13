/**
 * Helpers for providing snippet props from a test without a wrapper component.
 */

import { createRawSnippet } from 'svelte';

/**
 * @import { Snippet } from 'svelte';
 */

/**
 * Create a snippet rendering the given HTML, so a component’s `children` or any other snippet prop
 * can be provided from a test.
 * @param {string} markup Static HTML to render. It must have a single root element.
 * @returns {Snippet} Snippet.
 */
export const html = (markup) =>
  createRawSnippet(() => ({
    /**
     * Render the HTML.
     * @returns {string} HTML.
     */
    render: () => markup,
  }));

/**
 * Create a snippet rendering the given plain text, wrapped in a `<span>`.
 * @param {string} content Text to render.
 * @returns {Snippet} Snippet.
 */
export const text = (content) => {
  const span = document.createElement('span');

  span.textContent = content;

  return html(span.outerHTML);
};
