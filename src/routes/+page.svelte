<script>
  import {
    Button,
    Calendar,
    Checkbox,
    CheckboxGroup,
    Combobox,
    Disclosure,
    Listbox,
    MarkdownEditor,
    MenuButton,
    MenuItem,
    MenuItemCheckbox,
    MenuItemRadio,
    NumberInput,
    Option,
    PasswordInput,
    RadioButton,
    RadioButtonGroup,
    SearchBar,
    Select,
    SelectButton,
    SelectButtonGroup,
    Separator,
    Switch,
    Tab,
    TabList,
    TabPanel,
    TextArea,
    TextInput,
  } from '$lib';
</script>

<svelte:head>
  <title>Sveltia UI</title>
</svelte:head>

<main>
  <header>
    <h1>Sveltia UI</h1>
    <p>
      A clean, customizable, accessible web application UI component library for Svelte/SvelteKit
      projects.
    </p>
  </header>
  <section>
    <h2>Colors</h2>
    <section>
      <h3>Background</h3>
      <div class="color-samples">
        <span class="sample" style="background-color: hsl(var(--background-color-1-hsl));" />
        <span class="sample" style="background-color: hsl(var(--background-color-2-hsl));" />
        <span class="sample" style="background-color: hsl(var(--background-color-3-hsl));" />
        <span class="sample" style="background-color: hsl(var(--background-color-4-hsl));" />
      </div>
    </section>
    <section>
      <h3>Foreground</h3>
      <div class="color-samples">
        <span class="sample" style="color: hsl( var(--foreground-color-1-hsl));">Text</span>
        <span class="sample" style="color: hsl(var(--foreground-color-2-hsl));">Text</span>
        <span class="sample" style="color: hsl( var(--foreground-color-3-hsl));">Text</span>
        <span class="sample" style="color: hsl(var(--foreground-color-4-hsl));">Text</span>
      </div>
    </section>
  </section>
  <section>
    <h2>Data Input</h2>
    <section>
      <h3>Buttons &amp; Toggles</h3>
      <div class="row">
        <section aria-label="Buttons">
          <div>
            <Button class="primary" label="Primary" />
            <Button class="secondary" label="Secondary" />
            <Button class="trinary" label="Ternary" />
          </div>
        </section>
        <section aria-label="Select Buttons">
          <div>
            <SelectButtonGroup>
              <SelectButton class="secondary" selected={true}>Strawberry</SelectButton>
              <SelectButton class="secondary">Grape</SelectButton>
              <SelectButton class="secondary">Lemon</SelectButton>
            </SelectButtonGroup>
          </div>
        </section>
        <section aria-label="Radio Buttons">
          <div>
            <RadioButtonGroup>
              <RadioButton selected={true}>Strawberry</RadioButton>
              <RadioButton>Grape</RadioButton>
              <RadioButton>Lemon</RadioButton>
            </RadioButtonGroup>
          </div>
        </section>
        <section aria-label="Checkboxes">
          <div>
            <CheckboxGroup ariaLabel="Ingredients">
              <Checkbox name="ingredients" value="rice" checked={true}>Rice</Checkbox>
              <Checkbox name="ingredients" value="beans" checked={false}>Beans</Checkbox>
              <Checkbox name="ingredients" value="cheese" indeterminate={true}>Cheese</Checkbox>
            </CheckboxGroup>
          </div>
        </section>
        <section aria-label="Switch">
          <div>
            <Switch>Option 3</Switch>
          </div>
        </section>
      </div>
    </section>
    <section>
      <h3>Listbox</h3>
      <div class="row">
        <section>
          <h4>Single Select</h4>
          <div>
            <Listbox>
              <Option label="Option 1" selected={true} />
              <Option label="Option 2" />
              <Option label="Option 3" />
              <Option label="Option 4" />
              <Option label="Option 5" />
            </Listbox>
          </div>
        </section>
        <section>
          <h4>Multi Select</h4>
          <div>
            <Listbox multiple={true}>
              <Option label="Option 1" selected={true} />
              <Option label="Option 2" />
              <Option label="Option 3" selected={true} />
              <Option label="Option 4" />
              <Option label="Option 5" />
            </Listbox>
          </div>
        </section>
        <section>
          <h4>With Groups</h4>
          <div />
        </section>
      </div>
    </section>
    <section>
      <h3>Select &amp; Combobox</h3>
      <div class="row">
        <section>
          <h4>Default</h4>
          <div>
            <Select>
              <Option label="Option 1" selected={true} />
              <Option label="Option 2" />
              <Option label="Option 3" />
              <Separator />
              <Option label="Option 4" />
              <Option label="Option 5" />
            </Select>
          </div>
        </section>
        <section>
          <h4>Filtering enabled</h4>
          <div />
        </section>
        <section>
          <h4>Auto-complete</h4>
          <div>
            <Combobox>
              <Option label="Option 1" selected={true} />
              <Option label="Option 2" />
              <Option label="Option 3" />
              <Separator />
              <Option label="Option 4" />
              <Option label="Option 5" />
            </Combobox>
          </div>
        </section>
        <section>
          <h4>Tagging</h4>
          <div />
        </section>
      </div>
    </section>
    <section>
      <h3>Text Fields</h3>
      <div class="row">
        <section>
          <h4>Single line</h4>
          <div>
            <TextInput />
          </div>
        </section>
        <section>
          <h4>Password</h4>
          <div>
            <PasswordInput />
          </div>
        </section>
        <section>
          <h4>Number</h4>
          <div>
            <NumberInput />
          </div>
        </section>
        <section>
          <h4>Date</h4>
          <div />
        </section>
        <section>
          <h4>Search</h4>
          <div>
            <SearchBar />
          </div>
        </section>
        <section>
          <h4>Multi line</h4>
          <div>
            <TextArea />
          </div>
        </section>
      </div>
    </section>
    <section>
      <h3>Menu</h3>
      <div class="row">
        <section>
          <h4>Menu Button</h4>
          <div>
            <MenuButton class="secondary" label="Open Menu">
              <MenuItem label="Item" />
              <MenuItem label="Item">
                <MenuItem label="Child Item 1" />
                <MenuItem label="Child Item 2" />
                <MenuItem label="Child Item 3" />
                <Separator />
                <MenuItemCheckbox label="Child Item 4" checked={true} />
              </MenuItem>
              <MenuItem label="Item" disabled={true} />
              <Separator />
              <MenuItemCheckbox label="Item" checked={true} />
              <MenuItemCheckbox label="Item" checked={false} />
              <Separator />
              <MenuItemRadio label="Item" checked={true} />
              <MenuItemRadio label="Item" checked={false} />
            </MenuButton>
          </div>
        </section>
        <section>
          <h4>Menu Bar</h4>
          <div />
        </section>
        <section>
          <h4>With Groups</h4>
          <div />
        </section>
        <section>
          <h4>Context Menu</h4>
          <div>Right-click here</div>
        </section>
      </div>
    </section>
    <section>
      <h3>Expanders</h3>
      <div class="row">
        <section>
          <h4>Disclosure</h4>
          <Disclosure label="Event Details">Details?</Disclosure>
        </section>
        <section>
          <h4>Accordion</h4>
          <div />
        </section>
      </div>
    </section>
    <section>
      <h3>Tooltips</h3>
      <div class="row">
        <section>
          <h4>Tooltip</h4>
          <div>Hover here</div>
        </section>
      </div>
    </section>
    <section>
      <h3>Toolbar</h3>
    </section>
    <section>
      <h3>Tabs</h3>
      <div class="row">
        <section>
          <TabList>
            <Tab label="Tab 1" aria-controls="tabpanel-1" />
            <Tab label="Tab 2" aria-controls="tabpanel-2" />
            <Tab label="Tab 3" aria-controls="tabpanel-3" />
          </TabList>
          <!-- cSpell:disable -->
          <TabPanel id="tabpanel-1">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam pulvinar scelerisque
            tincidunt. Curabitur vel vehicula mauris.
          </TabPanel>
          <TabPanel id="tabpanel-2">
            Etiam laoreet elementum quam ac blandit. Present magna massa, interdum sed leo quis,
            mollis mattis justo. Sed porta suscipit feugiat.
          </TabPanel>
          <TabPanel id="tabpanel-3">
            Morbi scelerisque dui est, non ultricies dui sollicitudin ac. Sed quis ex eu massa
            sollicitudin malesuada. Ut et vulputate lacus, bibendum viverra quam.
          </TabPanel>
          <!-- cSpell:enable -->
        </section>
      </div>
    </section>
    <section>
      <h3>Dialog</h3>
      <div class="row">
        <section>
          <h4>Standard</h4>
          <div><Button class="secondary" label="Show Dialog" /></div>
        </section>
      </div>
    </section>
  </section>
  <section>
    <h2>Complex Widgets</h2>
    <section>
      <h3>Markdown Editor</h3>
      <div>
        <MarkdownEditor />
      </div>
    </section>
    <section>
      <h3>Calendar</h3>
      <div>
        <Calendar />
      </div>
    </section>
    <section>
      <h3>Data Grid</h3>
    </section>
  </section>
</main>

<style lang="scss">
  :global(body) {
    font-family: var(--default-font-family);
    font-size: var(--default-font-size);
    color: var(--primary-foreground-color);
    background-color: var(--primary-background-color);
  }

  :global(*) {
    box-sizing: border-box;
  }

  main {
    height: 100%;
    padding: 80px 80px 240px;
    overflow-y: scroll;
  }

  section {
    margin: 16px 0;
    padding: 16px;
    border-width: 1px;
    border-color: var(--primary-border-color);

    h2 {
      margin: 0;
    }

    section {
      border: 0;
      padding: 16px;

      h3 {
        margin: -16px -16px 16px;
        padding: 8px 16px;
        background-color: var(--secondary-background-color);
      }

      section {
        margin: 0;
        border: 0;
        padding: 0;

        h4 + div {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }
    }
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 32px;
    padding: 16px;

    & > * {
      width: 480px;
    }
  }

  .color-samples {
    display: flex;
    gap: 8px;
    background-color: var(--content-background-color);
    padding: 8px;

    .sample {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      border-width: 1px;
      border-color: var(--secondary-border-color);
      border-radius: 8px;
      min-width: 48px;
      min-height: 48px;
    }
  }
</style>
