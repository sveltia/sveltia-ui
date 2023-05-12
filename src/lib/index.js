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
    const [, locale] = path.match(/([a-zA-Z-]+)\.js/);

    // Add `_sui` suffix to avoid collision with app localization
    addMessages(locale, { _sui: strings });
  });

  init({
    fallbackLocale,
    initialLocale,
  });
};

initLocales();

// @ts-ignore
export { default as Calendar } from './components/composite/calendar.svelte';
// @ts-ignore
export { default as CheckboxGroup } from './components/composite/checkbox-group.svelte';
// @ts-ignore
export { default as Combobox } from './components/composite/combobox.svelte';
// @ts-ignore
export { default as Disclosure } from './components/composite/disclosure.svelte';
// @ts-ignore
export { default as Grid } from './components/composite/grid.svelte';
// @ts-ignore
export { default as Listbox } from './components/composite/listbox.svelte';
// @ts-ignore
export { default as MenuItemGroup } from './components/composite/menu-item-group.svelte';
// @ts-ignore
export { default as Menu } from './components/composite/menu.svelte';
// @ts-ignore
export { default as RadioButtonGroup } from './components/composite/radio-button-group.svelte';
// @ts-ignore
export { default as SelectButtonGroup } from './components/composite/select-button-group.svelte';
// @ts-ignore
export { default as Select } from './components/composite/select.svelte';
// @ts-ignore
export { default as TabList } from './components/composite/tab-list.svelte';
// @ts-ignore
export { default as Button } from './components/core/button.svelte';
// @ts-ignore
export { default as Checkbox } from './components/core/checkbox.svelte';
// @ts-ignore
export { default as Dialog } from './components/core/dialog.svelte';
// @ts-ignore
export { default as Drawer } from './components/core/drawer.svelte';
// @ts-ignore
export { default as GridCell } from './components/core/grid-cell.svelte';
// @ts-ignore
export { default as Group } from './components/core/group.svelte';
// @ts-ignore
export { default as Icon } from './components/core/icon.svelte';
// @ts-ignore
export { default as MenuButton } from './components/core/menu-button.svelte';
// @ts-ignore
export { default as MenuItemCheckbox } from './components/core/menu-item-checkbox.svelte';
// @ts-ignore
export { default as MenuItemRadio } from './components/core/menu-item-radio.svelte';
// @ts-ignore
export { default as MenuItem } from './components/core/menu-item.svelte';
// @ts-ignore
export { default as NumberInput } from './components/core/number-input.svelte';
// @ts-ignore
export { default as Option } from './components/core/option.svelte';
// @ts-ignore
export { default as PasswordInput } from './components/core/password-input.svelte';
// @ts-ignore
export { default as RadioButton } from './components/core/radio-button.svelte';
// @ts-ignore
export { default as RowGroup } from './components/core/row-group.svelte';
// @ts-ignore
export { default as Row } from './components/core/row.svelte';
// @ts-ignore
export { default as SearchBar } from './components/core/search-bar.svelte';
// @ts-ignore
export { default as SelectButton } from './components/core/select-button.svelte';
// @ts-ignore
export { default as Separator } from './components/core/separator.svelte';
// @ts-ignore
export { default as Slider } from './components/core/slider.svelte';
// @ts-ignore
export { default as Spacer } from './components/core/spacer.svelte';
// @ts-ignore
export { default as Switch } from './components/core/switch.svelte';
// @ts-ignore
export { default as TabPanel } from './components/core/tab-panel.svelte';
// @ts-ignore
export { default as Tab } from './components/core/tab.svelte';
// @ts-ignore
export { default as TextArea } from './components/core/text-area.svelte';
// @ts-ignore
export { default as TextInput } from './components/core/text-input.svelte';
// @ts-ignore
export { default as Toolbar } from './components/core/toolbar.svelte';
// @ts-ignore
export { default as MarkdownEditor } from './components/editor/markdown.svelte';
// @ts-ignore
export { default as AppShell } from './components/util/app-shell.svelte';
