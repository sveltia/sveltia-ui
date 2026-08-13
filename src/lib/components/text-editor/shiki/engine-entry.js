/**
 * Entry point for the standalone Shiki engine chunk built by `scripts/build-shiki-engine.js`.
 *
 * This is the complete set of Shiki APIs the vendored highlighter needs. It is never imported
 * directly by the library — only bundled into `dist/shiki-engine.js` and loaded at runtime — so
 * Shiki stays a development dependency and never reaches a consumer’s bundle.
 *
 * Everything is imported through the `shiki` package rather than from `@shikijs/*` directly,
 * because `shiki` pins those to exact versions. That keeps the engine bundled here and the
 * grammars fetched at runtime on the same version, which `generated.js` records.
 */

export {
  createHighlighterCoreSync,
  getTokenStyleObject,
  isSpecialLang,
  isSpecialTheme,
  stringifyTokenStyle,
} from 'shiki/core';
export { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
