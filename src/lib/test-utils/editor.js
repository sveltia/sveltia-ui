/**
 * Helpers for testing the text editor components.
 */

/**
 * @import { ComponentProps } from 'svelte';
 * @import { TextEditorStore } from '$lib/typedefs';
 * @import EditorFixture from '$lib/components/text-editor/editor-fixture.test.svelte';
 */

/**
 * Get the editor store the fixture has bound to its props. The fixture creates the store as it
 * initializes, so it’s always there once the fixture has rendered.
 * @param {ComponentProps<typeof EditorFixture>} props Fixture props.
 * @returns {TextEditorStore} Store.
 */
export const getEditorStore = ({ store }) => /** @type {TextEditorStore} */ (store);
