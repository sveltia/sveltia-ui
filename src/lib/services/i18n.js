import { addMessages, locale as appLocale, init } from 'svelte-i18n';

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

/**
 * List of RTL locales: Arabic, Persian, Hebrew, Urdu.
 */
const RTL_LOCALES = ['ar', 'fa', 'he', 'ur'];

/**
 * Get the text direction of the given locale.
 * @param {string | null | undefined} locale Locale code.
 * @returns {'rtl' | 'ltr'} Text direction.
 */
const getDirection = (locale) =>
  locale && RTL_LOCALES.includes(locale.split('-')[0]) ? 'rtl' : 'ltr';

if (!import.meta.env.SSR) {
  // Set the `dir` attribute on the HTML element based on the current locale.
  // @todo Move this to Sveltia UI and then Sveltia I18N
  appLocale.subscribe((value) => {
    document.documentElement.dir = getDirection(value);
  });
}
