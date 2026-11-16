/**
 * Values shared by the grid components.
 */

/**
 * Context key telling a `<GridRow>` whether it’s in a `<GridHead>` or `<GridFoot>`, where rows can
 * be focused but not selected. A nested `<Grid>` resets it, as its rows are data rows of its own.
 * `createContext()` isn’t used, as it requires a newer Svelte version than the library supports.
 * @type {string}
 */
export const UNSELECTABLE_ROWS_KEY = 'sui:grid-unselectable-rows';
