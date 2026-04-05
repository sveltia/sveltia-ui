import { addMessages, init } from '@sveltia/i18n';
import { parse as parseYaml } from 'yaml';

/**
 * Load strings and initialize the locales.
 * @param {object} [init] Initialize options.
 * @param {string} [init.fallbackLocale] Fallback locale.
 * @param {string} [init.initialLocale] Initial locale.
 * @see https://github.com/sveltia/sveltia-i18n
 * @see https://vitejs.dev/guide/features.html#glob-import
 */
export const initLocales = ({ fallbackLocale = 'en', initialLocale = 'en' } = {}) => {
  const resources = import.meta.glob('../locales/*.yaml', {
    eager: true,
    query: '?raw',
    import: 'default',
  });

  Object.entries(resources).forEach(([path, resource]) => {
    addMessages(
      /** @type {string} */ (path.match(/.+\/(?<locale>.+?)\.yaml$/)?.groups?.locale),
      // Add `_sui` suffix to avoid collision with app localization
      { _sui: parseYaml(/** @type {string} */ (resource)) },
    );
  });

  init({ fallbackLocale, initialLocale });
};
