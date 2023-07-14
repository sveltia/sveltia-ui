<script>
  import {
    Alert,
    Button,
    Calendar,
    Checkbox,
    CheckboxGroup,
    Combobox,
    Dialog,
    Disclosure,
    Divider,
    Drawer,
    Icon,
    Listbox,
    MarkdownEditor,
    Menu,
    MenuButton,
    MenuItem,
    MenuItemCheckbox,
    MenuItemRadio,
    NumberInput,
    Option,
    OptionGroup,
    PasswordInput,
    Radio,
    RadioGroup,
    SearchBar,
    Select,
    SelectButton,
    SelectButtonGroup,
    Slider,
    Switch,
    Tab,
    TabList,
    TabPanel,
    Table,
    TableBody,
    TableCell,
    TableColHeader,
    TableHead,
    TableRow,
    TableRowHeader,
    TextArea,
    TextInput,
  } from '$lib';

  let openStandardDialog = false;
  const openStandardDrawer = { top: false, right: false, bottom: false, left: false };
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
        <span class="sample" style:background-color="var(--primary-background-color)">
          Primary
        </span>
        <span class="sample" style:background-color="var(--secondary-background-color)">
          Secondary
        </span>
        <span class="sample" style:background-color="var(--tertiary-background-color)">
          tertiary
        </span>
        <span class="sample" style:background-color="var(--disabled-background-color)">
          Disabled
        </span>
      </div>
    </section>
    <section>
      <h3>Foreground</h3>
      <div class="color-samples">
        <span class="sample" style:color="var(--primary-foreground-color)"> Primary </span>
        <span class="sample" style:color="var(--secondary-foreground-color)"> Secondary </span>
        <span class="sample" style:color="var(--tertiary-foreground-color)"> tertiary </span>
        <span class="sample" style:color="var(--disabled-foreground-color)"> Disabled </span>
      </div>
    </section>
    <section>
      <h3>Alerts</h3>
      <div class="color-samples">
        <span
          class="sample"
          style:border-color="var(--error-border-color)"
          style:color="var(--error-foreground-color)"
          style:background-color="var(--error-background-color)"
        >
          Error / Danger
        </span>
        <span
          class="sample"
          style:border-color="var(--warning-border-color)"
          style:color="var(--warning-foreground-color)"
          style:background-color="var(--warning-background-color)"
        >
          Warning
        </span>
        <span
          class="sample"
          style:border-color="var(--info-border-color)"
          style:color="var(--info-foreground-color)"
          style:background-color="var(--info-background-color)"
        >
          Info
        </span>
        <span
          class="sample"
          style:border-color="var(--success-border-color)"
          style:color="var(--success-foreground-color)"
          style:background-color="var(--success-background-color)"
        >
          Success
        </span>
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
            <Button class="tertiary" label="Tertiary" />
            <Button class="ghost" label="Ghost" />
          </div>
        </section>
        <section>
          <h4>Icon Buttons</h4>
          <div>
            <Button class="secondary" label="Tag">
              <Icon slot="start-icon" name="sell" />
            </Button>
            <Button class="primary" label="Add">
              <Icon slot="end-icon" name="add" />
            </Button>
            <Button class="secondary iconic">
              <Icon slot="end-icon" name="delete" label="Delete" />
            </Button>
          </div>
        </section>
        <section aria-label="Select Buttons">
          <div>
            <SelectButtonGroup>
              <SelectButton class="tertiary" selected={true}>Strawberry</SelectButton>
              <SelectButton class="tertiary">Grape</SelectButton>
              <SelectButton class="tertiary">Lemon</SelectButton>
            </SelectButtonGroup>
          </div>
        </section>
        <section aria-label="Radio Buttons">
          <div>
            <RadioGroup>
              <Radio selected={true}>Strawberry</Radio>
              <Radio>Grape</Radio>
              <Radio>Lemon</Radio>
            </RadioGroup>
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
      <h3>Sliders</h3>
      <div class="row">
        <section aria-label="Slider">
          <div>
            <Slider />
          </div>
          <div>
            <Slider values={[1, 5]} min={1} max={5} step={0.1} optionLabels={[1, 2, 3, 4, 5]} />
          </div>
          <div>
            <Slider values={[0, 24]} min={0} max={24} step={3} optionLabels={[0, 6, 12, 18, 24]} />
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
          <div>
            <Listbox>
              <OptionGroup label="Group 1">
                <Option label="Option 1" selected={true} />
                <Option label="Option 2" />
              </OptionGroup>
              <OptionGroup label="Group 2">
                <Option label="Option 3" />
                <Option label="Option 4" />
                <Option label="Option 5" />
              </OptionGroup>
            </Listbox>
          </div>
        </section>
        <section>
          <h4>With Groups (vertical tab style)</h4>
          <div>
            <Listbox class="tabs">
              <OptionGroup label="Group 1">
                <Option label="Option 1" selected={true} />
                <Option label="Option 2" />
              </OptionGroup>
              <OptionGroup label="Group 2">
                <Option label="Option 3" />
                <Option label="Option 4" />
                <Option label="Option 5" />
              </OptionGroup>
            </Listbox>
          </div>
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
              <Divider />
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
              <Divider />
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
            <MenuButton class="tertiary" label="Open Menu">
              <Icon slot="end-icon" name="arrow_drop_down" />
              <Menu slot="popup">
                <MenuItem label="Item" />
                <MenuItem label="Item" disabled={true} />
                <Divider />
                <MenuItemCheckbox label="Item" checked={true} />
                <MenuItemCheckbox label="Item" checked={false} />
                <Divider />
                <MenuItemRadio label="Item" checked={true} />
                <MenuItemRadio label="Item" checked={false} />
              </Menu>
            </MenuButton>
          </div>
        </section>
        <section>
          <h4>Menu Button with Nested Menu</h4>
          <div>
            <MenuButton class="tertiary" label="Open Menu">
              <Icon slot="end-icon" name="arrow_drop_down" />
              <Menu slot="popup">
                <MenuItem label="Item" />
                <MenuItem label="Item">
                  <MenuItem label="Child Item 1" />
                  <MenuItem label="Child Item 2" />
                  <MenuItem label="Child Item 3" />
                  <Divider />
                  <MenuItemCheckbox label="Child Item 4" checked={true} />
                </MenuItem>
                <MenuItem label="Item" disabled={true} />
                <Divider />
                <MenuItemCheckbox label="Item" checked={true} />
                <MenuItemCheckbox label="Item" checked={false} />
                <Divider />
                <MenuItemRadio label="Item" checked={true} />
                <MenuItemRadio label="Item" checked={false} />
              </Menu>
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
      <h3>Drawer</h3>
      <div class="row">
        <section>
          <h4>Standard</h4>
          <div>
            <Button
              class="secondary"
              label="Show Drawer: right"
              on:click={() => {
                openStandardDrawer.right = true;
              }}
            />
            <Drawer bind:open={openStandardDrawer.right} title="Drawer" position="right">
              Hello World!
            </Drawer>
          </div>
          <div>
            <Button
              class="secondary"
              label="Show Drawer: left"
              on:click={() => {
                openStandardDrawer.left = true;
              }}
            />
            <Drawer bind:open={openStandardDrawer.left} title="Drawer" position="left">
              Hello World!
            </Drawer>
          </div>
          <div>
            <Button
              class="secondary"
              label="Show Drawer: top"
              on:click={() => {
                openStandardDrawer.top = true;
              }}
            />
            <Drawer bind:open={openStandardDrawer.top} title="Drawer" position="top">
              Hello World!
            </Drawer>
          </div>
          <div>
            <Button
              class="secondary"
              label="Show Drawer: bottom"
              on:click={() => {
                openStandardDrawer.bottom = true;
              }}
            />
            <Drawer bind:open={openStandardDrawer.bottom} title="Drawer" position="bottom">
              Hello World!
            </Drawer>
          </div>
        </section>
      </div>
    </section>
  </section>
  <section>
    <h2>Feedback</h2>
    <section>
      <h3>Alert</h3>
      <div class="row">
        <section>
          <h4>Standard</h4>
          <div style="display:block">
            <div>
              <Alert type="error">Error</Alert>
            </div>
            <div>
              <Alert type="warning">Warning</Alert>
            </div>
            <div>
              <Alert type="info">Info</Alert>
            </div>
            <div>
              <Alert type="success">Success</Alert>
            </div>
          </div>
        </section>
        <section>
          <h4>Small, aria-live="off"</h4>
          <div style="display:block">
            <div>
              <Alert type="error" aria-live="off" --font-size="var(--font-size--small)">
                Error
              </Alert>
            </div>
            <div>
              <Alert type="warning" aria-live="off" --font-size="var(--font-size--small)">
                Warning
              </Alert>
            </div>
            <div>
              <Alert type="info" aria-live="off" --font-size="var(--font-size--small)">Info</Alert>
            </div>
            <div>
              <Alert type="success" aria-live="off" --font-size="var(--font-size--small)">
                Success
              </Alert>
            </div>
          </div>
        </section>
        <section>
          <h4>Custom icons</h4>
          <div style="display:block">
            <div>
              <Alert type="error">
                <Icon name="dangerous" slot="icon" />
                Error
              </Alert>
            </div>
            <div>
              <Alert type="warning">
                <Icon name="emergency_home" slot="icon" />
                Warning
              </Alert>
            </div>
            <div>
              <Alert type="info">
                <Icon name="help" slot="icon" />
                Info
              </Alert>
            </div>
            <div>
              <Alert type="success">
                <Icon name="verified" slot="icon" />
                Success
              </Alert>
            </div>
          </div>
        </section>
      </div>
    </section>
    <section>
      <h3>Dialog</h3>
      <div class="row">
        <section>
          <h4>Standard</h4>
          <div>
            <Button
              class="secondary"
              label="Show Dialog"
              on:click={() => {
                openStandardDialog = true;
              }}
            />
            <Dialog bind:open={openStandardDialog} title="Standard Dialog">Hello</Dialog>
          </div>
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
      <h3>Table</h3>
      <div>
        <Table class="data">
          <TableHead>
            <TableRow>
              <TableColHeader />
              <TableColHeader>Column 1</TableColHeader>
              <TableColHeader>Column 2</TableColHeader>
              <TableColHeader>Column 3</TableColHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableRowHeader>Row 1</TableRowHeader>
              <TableCell>Cell 1</TableCell>
              <TableCell>Cell 2</TableCell>
              <TableCell>Cell 3</TableCell>
            </TableRow>
          </TableBody>
          <TableBody>
            <TableRow>
              <TableRowHeader>Row 2</TableRowHeader>
              <TableCell>Cell 4</TableCell>
              <TableCell>Cell 5</TableCell>
              <TableCell>Cell 6</TableCell>
            </TableRow>
          </TableBody>
          <TableBody>
            <TableRow>
              <TableColHeader />
              <TableColHeader>Column 1</TableColHeader>
              <TableColHeader>Column 2</TableColHeader>
              <TableColHeader>Column 3</TableColHeader>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>
  </section>
</main>

<style lang="scss">
  :global(body) {
    font-family: var(--font-family--default);
    font-size: var(--font-size--default);
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
      min-width: 160px;
      min-height: 48px;
    }
  }
</style>
