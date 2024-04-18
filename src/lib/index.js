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

export { default as Alert } from '$lib/components/alert/alert.svelte';
export { default as ButtonGroup } from '$lib/components/button/button-group.svelte';
export { default as Button } from '$lib/components/button/button.svelte';
export { default as SelectButtonGroup } from '$lib/components/button/select-button-group.svelte';
export { default as SelectButton } from '$lib/components/button/select-button.svelte';
export { default as SplitButton } from '$lib/components/button/split-button.svelte';
export { default as Calendar } from '$lib/components/calendar/calendar.svelte';
export { default as CheckboxGroup } from '$lib/components/checkbox/checkbox-group.svelte';
export { default as Checkbox } from '$lib/components/checkbox/checkbox.svelte';
export { default as AlertDialog } from '$lib/components/dialog/alert-dialog.svelte';
export { default as ConfirmationDialog } from '$lib/components/dialog/confirmation-dialog.svelte';
export { default as Dialog } from '$lib/components/dialog/dialog.svelte';
export { default as PromptDialog } from '$lib/components/dialog/prompt-dialog.svelte';
export { default as Disclosure } from '$lib/components/disclosure/disclosure.svelte';
export { default as Divider } from '$lib/components/divider/divider.svelte';
export { default as Spacer } from '$lib/components/divider/spacer.svelte';
export { default as Drawer } from '$lib/components/drawer/drawer.svelte';
export { default as GridBody } from '$lib/components/grid/grid-body.svelte';
export { default as GridCell } from '$lib/components/grid/grid-cell.svelte';
export { default as GridColHeader } from '$lib/components/grid/grid-col-header.svelte';
export { default as GridFoot } from '$lib/components/grid/grid-foot.svelte';
export { default as GridHead } from '$lib/components/grid/grid-head.svelte';
export { default as GridRowHeader } from '$lib/components/grid/grid-row-header.svelte';
export { default as GridRow } from '$lib/components/grid/grid-row.svelte';
export { default as Grid } from '$lib/components/grid/grid.svelte';
export { default as Icon } from '$lib/components/icon/icon.svelte';
export { default as Listbox } from '$lib/components/listbox/listbox.svelte';
export { default as OptionGroup } from '$lib/components/listbox/option-group.svelte';
export { default as Option } from '$lib/components/listbox/option.svelte';
export { default as MenuButton } from '$lib/components/menu/menu-button.svelte';
export { default as MenuItemCheckbox } from '$lib/components/menu/menu-item-checkbox.svelte';
export { default as MenuItemGroup } from '$lib/components/menu/menu-item-group.svelte';
export { default as MenuItemRadio } from '$lib/components/menu/menu-item-radio.svelte';
export { default as MenuItem } from '$lib/components/menu/menu-item.svelte';
export { default as Menu } from '$lib/components/menu/menu.svelte';
export { default as RadioGroup } from '$lib/components/radio/radio-group.svelte';
export { default as Radio } from '$lib/components/radio/radio.svelte';
export { default as Combobox } from '$lib/components/select/combobox.svelte';
export { default as Select } from '$lib/components/select/select.svelte';
export { default as Slider } from '$lib/components/slider/slider.svelte';
export { default as Switch } from '$lib/components/switch/switch.svelte';
export { default as TableBody } from '$lib/components/table/table-body.svelte';
export { default as TableCell } from '$lib/components/table/table-cell.svelte';
export { default as TableColHeader } from '$lib/components/table/table-col-header.svelte';
export { default as TableFoot } from '$lib/components/table/table-foot.svelte';
export { default as TableHead } from '$lib/components/table/table-head.svelte';
export { default as TableRowHeader } from '$lib/components/table/table-row-header.svelte';
export { default as TableRow } from '$lib/components/table/table-row.svelte';
export { default as Table } from '$lib/components/table/table.svelte';
export { default as TabBox } from '$lib/components/tabs/tab-box.svelte';
export { default as TabList } from '$lib/components/tabs/tab-list.svelte';
export { default as TabPanel } from '$lib/components/tabs/tab-panel.svelte';
export { default as TabPanels } from '$lib/components/tabs/tab-panels.svelte';
export { default as Tab } from '$lib/components/tabs/tab.svelte';
export { default as MarkdownEditor } from '$lib/components/text-field/markdown-editor.svelte';
export { default as NumberInput } from '$lib/components/text-field/number-input.svelte';
export { default as PasswordInput } from '$lib/components/text-field/password-input.svelte';
export { default as SearchBar } from '$lib/components/text-field/search-bar.svelte';
export { default as TextArea } from '$lib/components/text-field/text-area.svelte';
export { default as TextInput } from '$lib/components/text-field/text-input.svelte';
export { default as Toast } from '$lib/components/toast/toast.svelte';
export { default as Toolbar } from '$lib/components/toolbar/toolbar.svelte';
export { default as AppShell } from '$lib/components/util/app-shell.svelte';
export { default as Group } from '$lib/components/util/group.svelte';
export { default as Modal } from '$lib/components/util/modal.svelte';

export * from '$lib/services/util';
