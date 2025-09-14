import { addMessages, init } from 'svelte-i18n';

/**
 * Load strings and initialize the locales.
 * @param {object} [init] Initialize options.
 * @param {string} [init.fallbackLocale] Fallback locale.
 * @param {string} [init.initialLocale] Initial locale.
 * @see https://github.com/kaisermann/svelte-i18n/blob/main/docs/Getting%20Started.md
 * @see https://vitejs.dev/guide/features.html#glob-import
 */
export const initLocales = ({ fallbackLocale = 'en', initialLocale = 'en' } = {}) => {
  /** @type {{ [key: string]: { strings: object }}} */
  const modules = import.meta.glob('./locales/*.js', { eager: true });

  Object.entries(modules).forEach(([path, { strings }]) => {
    const [, locale] = /** @type {string[]} */ (path.match(/([a-zA-Z-]+)\.js/));

    // Add `_sui` suffix to avoid collision with app localization
    addMessages(locale, /** @type {any} */ ({ _sui: strings }));
  });

  init({
    fallbackLocale,
    initialLocale,
  });
};
