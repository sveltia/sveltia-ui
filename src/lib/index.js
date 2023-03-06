import { addMessages, init } from 'svelte-i18n';

/**
 * Load strings and initialize the locales.
 * @see https://github.com/kaisermann/svelte-i18n/blob/main/docs/Getting%20Started.md
 * @see https://vitejs.dev/guide/features.html#glob-import
 */
const initLocales = () => {
  const modules = import.meta.glob('./locales/*.js', { eager: true });

  Object.entries(modules).forEach(([path, { strings }]) => {
    const [, locale] = path.match(/([a-zA-Z-]+)\.js/);

    // Add `sui` suffix to avoid collision with app localization
    addMessages(locale, { sui: strings });
  });

  init({
    fallbackLocale: 'en',
    initialLocale: 'en',
  });
};

initLocales();

export { default as Calendar } from './components/composite/calendar.svelte';
export { default as CheckboxGroup } from './components/composite/checkbox-group.svelte';
export { default as Combobox } from './components/composite/combobox.svelte';
export { default as Disclosure } from './components/composite/disclosure.svelte';
export { default as Grid } from './components/composite/grid.svelte';
export { default as Listbox } from './components/composite/listbox.svelte';
export { default as MenuItemGroup } from './components/composite/menu-item-group.svelte';
export { default as Menu } from './components/composite/menu.svelte';
export { default as RadioButtonGroup } from './components/composite/radio-button-group.svelte';
export { default as SelectButtonGroup } from './components/composite/select-button-group.svelte';
export { default as Select } from './components/composite/select.svelte';
export { default as TabList } from './components/composite/tab-list.svelte';
export { default as Button } from './components/core/button.svelte';
export { default as Checkbox } from './components/core/checkbox.svelte';
export { default as Dialog } from './components/core/dialog.svelte';
export { default as GridCell } from './components/core/grid-cell.svelte';
export { default as Group } from './components/core/group.svelte';
export { default as Icon } from './components/core/icon.svelte';
export { default as MenuButton } from './components/core/menu-button.svelte';
export { default as MenuItemCheckbox } from './components/core/menu-item-checkbox.svelte';
export { default as MenuItemRadio } from './components/core/menu-item-radio.svelte';
export { default as MenuItem } from './components/core/menu-item.svelte';
export { default as NumberInput } from './components/core/number-input.svelte';
export { default as Option } from './components/core/option.svelte';
export { default as PasswordInput } from './components/core/password-input.svelte';
export { default as RadioButton } from './components/core/radio-button.svelte';
export { default as RowGroup } from './components/core/row-group.svelte';
export { default as Row } from './components/core/row.svelte';
export { default as SearchBar } from './components/core/search-bar.svelte';
export { default as SelectButton } from './components/core/select-button.svelte';
export { default as Separator } from './components/core/separator.svelte';
export { default as Spacer } from './components/core/spacer.svelte';
export { default as Switch } from './components/core/switch.svelte';
export { default as TabPanel } from './components/core/tab-panel.svelte';
export { default as Tab } from './components/core/tab.svelte';
export { default as TextArea } from './components/core/text-area.svelte';
export { default as TextInput } from './components/core/text-input.svelte';
export { default as Toolbar } from './components/core/toolbar.svelte';
export { default as MarkdownEditor } from './components/editor/markdown.svelte';
export { default as AppShell } from './components/util/app-shell.svelte';
