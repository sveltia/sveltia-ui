import { addMessages, init } from 'svelte-i18n';

/**
 * Load strings and initialize the locales.
 * @param {object} [init] - Initialize options.
 * @param {string} [init.fallbackLocale] - Fallback locale.
 * @param {string} [init.initialLocale] - Initial locale.
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

initLocales();

export { default as Alert } from './components/alert/alert.svelte';
export { default as ButtonGroup } from './components/button/button-group.svelte';
export { default as Button } from './components/button/button.svelte';
export { default as SelectButtonGroup } from './components/button/select-button-group.svelte';
export { default as SelectButton } from './components/button/select-button.svelte';
export { default as SplitButton } from './components/button/split-button.svelte';
export { default as Calendar } from './components/calendar/calendar.svelte';
export { default as CheckboxGroup } from './components/checkbox/checkbox-group.svelte';
export { default as Checkbox } from './components/checkbox/checkbox.svelte';
export { default as AlertDialog } from './components/dialog/alert-dialog.svelte';
export { default as ConfirmationDialog } from './components/dialog/confirmation-dialog.svelte';
export { default as Dialog } from './components/dialog/dialog.svelte';
export { default as PromptDialog } from './components/dialog/prompt-dialog.svelte';
export { default as Disclosure } from './components/disclosure/disclosure.svelte';
export { default as Divider } from './components/divider/divider.svelte';
export { default as Spacer } from './components/divider/spacer.svelte';
export { default as Drawer } from './components/drawer/drawer.svelte';
export { default as GridBody } from './components/grid/grid-body.svelte';
export { default as GridCell } from './components/grid/grid-cell.svelte';
export { default as GridColHeader } from './components/grid/grid-col-header.svelte';
export { default as GridFoot } from './components/grid/grid-foot.svelte';
export { default as GridHead } from './components/grid/grid-head.svelte';
export { default as GridRowHeader } from './components/grid/grid-row-header.svelte';
export { default as GridRow } from './components/grid/grid-row.svelte';
export { default as Grid } from './components/grid/grid.svelte';
export { default as Icon } from './components/icon/icon.svelte';
export { default as Listbox } from './components/listbox/listbox.svelte';
export { default as OptionGroup } from './components/listbox/option-group.svelte';
export { default as Option } from './components/listbox/option.svelte';
export { default as MenuButton } from './components/menu/menu-button.svelte';
export { default as MenuItemCheckbox } from './components/menu/menu-item-checkbox.svelte';
export { default as MenuItemGroup } from './components/menu/menu-item-group.svelte';
export { default as MenuItemRadio } from './components/menu/menu-item-radio.svelte';
export { default as MenuItem } from './components/menu/menu-item.svelte';
export { default as Menu } from './components/menu/menu.svelte';
export { default as Progressbar } from './components/progressbar/progressbar.svelte';
export { default as RadioGroup } from './components/radio/radio-group.svelte';
export { default as Radio } from './components/radio/radio.svelte';
export { default as Combobox } from './components/select/combobox.svelte';
export { default as SelectTags } from './components/select/select-tags.svelte';
export { default as Select } from './components/select/select.svelte';
export { default as Slider } from './components/slider/slider.svelte';
export { default as Switch } from './components/switch/switch.svelte';
export { default as TableBody } from './components/table/table-body.svelte';
export { default as TableCell } from './components/table/table-cell.svelte';
export { default as TableColHeader } from './components/table/table-col-header.svelte';
export { default as TableFoot } from './components/table/table-foot.svelte';
export { default as TableHead } from './components/table/table-head.svelte';
export { default as TableRowHeader } from './components/table/table-row-header.svelte';
export { default as TableRow } from './components/table/table-row.svelte';
export { default as Table } from './components/table/table.svelte';
export { default as TabBox } from './components/tabs/tab-box.svelte';
export { default as TabList } from './components/tabs/tab-list.svelte';
export { default as TabPanel } from './components/tabs/tab-panel.svelte';
export { default as TabPanels } from './components/tabs/tab-panels.svelte';
export { default as Tab } from './components/tabs/tab.svelte';
export { default as TextEditor } from './components/text-editor/text-editor.svelte';
export { default as NumberInput } from './components/text-field/number-input.svelte';
export { default as PasswordInput } from './components/text-field/password-input.svelte';
export { default as SearchBar } from './components/text-field/search-bar.svelte';
export { default as TextArea } from './components/text-field/text-area.svelte';
export { default as TextInput } from './components/text-field/text-input.svelte';
export { default as Toast } from './components/toast/toast.svelte';
export { default as Toolbar } from './components/toolbar/toolbar.svelte';
export { default as AppShell } from './components/util/app-shell.svelte';
export { default as Group } from './components/util/group.svelte';
export { default as Modal } from './components/util/modal.svelte';

// eslint-disable-next-line import/export
export * from './typedefs';
