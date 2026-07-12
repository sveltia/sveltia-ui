import { addMessages, init } from '@sveltia/i18n';

const rawResources = import.meta.glob('../locales/*.yaml', { eager: true, import: 'default' });

/**
 * Object containing all the locale resources, with the locale names as keys and the corresponding
 * strings as values.
 * @type {Record<string, Record<string, string>>}
 */
export const resources = Object.fromEntries(
  Object.entries(rawResources).map(([path, resource]) => [
    /** @type {string} */ (path.match(/.+\/(?<locale>.+?)\.yaml$/)?.groups?.locale),
    /** @type {Record<string, string>} */ (resource),
  ]),
);

/**
 * Load strings and initialize the locales. Consumers can use this function to load the localized
 * strings for their application. If `<AppShell>` is used, this function is called automatically.
 * @param {object} [init] Initialize options.
 * @param {string} [init.fallbackLocale] Fallback locale.
 * @param {string} [init.initialLocale] Initial locale.
 * @see https://github.com/sveltia/sveltia-i18n
 * @see https://vitejs.dev/guide/features.html#glob-import
 */
export const initLocales = ({ fallbackLocale = 'en', initialLocale = 'en' } = {}) => {
  Object.entries(resources).forEach(([locale, resource]) => {
    // Add `_sui` suffix to avoid collision with app localization
    addMessages(locale, { _sui: resource });
  });

  init({ fallbackLocale, initialLocale });
};
