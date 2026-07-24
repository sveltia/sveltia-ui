import { addMessages, init } from '@sveltia/i18n';

const resources = import.meta.glob('../locales/*.yaml', { eager: true, import: 'default' });

/**
 * Object containing all the locale resources, with the locale names as keys and the corresponding
 * strings as values.
 * @type {Record<string, Record<string, string>>}
 */
export const strings = Object.fromEntries(
  Object.entries(resources).map(([path, resource]) => [
    /** @type {string} */ (path.match(/.+\/(?<locale>.+?)\.yaml$/)?.groups?.locale),
    /** @type {Record<string, string>} */ (resource),
  ]),
);

/**
 * Load strings and initialize the locales. Consumers can use this function or {@link strings} to
 * load the localized strings for their application.
 * @param {object} [init] Initialize options.
 * @param {string} [init.fallbackLocale] Fallback locale.
 * @param {string} [init.initialLocale] Initial locale.
 * @see https://github.com/sveltia/sveltia-i18n
 * @see https://vitejs.dev/guide/features.html#glob-import
 */
export const initLocales = ({ fallbackLocale = 'en-US', initialLocale = 'en-US' } = {}) => {
  Object.entries(strings).forEach(([locale, resource]) => {
    // Add `_sui` suffix to avoid collision with app localization
    addMessages(locale, { _sui: resource });
  });

  init({ fallbackLocale, initialLocale });
};
