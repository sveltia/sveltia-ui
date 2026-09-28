/* eslint-disable jsdoc/require-jsdoc */

import { DecoratorNode } from 'lexical';

/**
 * Example editor components for the demo page, loosely modelled on the ones Sveltia CMS creates
 * with `CMS.registerEditorComponent()`: each is a Lexical decorator node rendering a small form for
 * its fields, plus a Markdown transformer.
 */

/**
 * @import { LexicalEditor, LexicalNode } from 'lexical';
 * @import { TextEditorComponent } from '$lib/typedefs';
 */

/**
 * @typedef {object} DemoField
 * @property {string} name Field name.
 * @property {string} label Field label.
 * @property {string[]} [options] Options for a select field.
 * @property {boolean} [multiline] Whether to use a `<textarea>`.
 */

/**
 * @typedef {object} DemoComponentDefinition
 * @property {string} id Component ID.
 * @property {string} label Component label.
 * @property {string} icon Material Symbols icon name.
 * @property {'button' | 'menuitem'} trigger Trigger UI.
 * @property {boolean} inline Whether the component is inline.
 * @property {DemoField[]} fields Fields.
 * @property {Record<string, string>} defaults Default field values.
 * @property {(props: Record<string, string>) => string} toBlock Convert the field values to
 * Markdown.
 * @property {(groups: Record<string, string>) => Record<string, string>} [fromBlock] Convert the
 * named groups matched in Markdown to field values. Defaults to using them as is.
 */

/**
 * Render the form for a component node.
 * @param {DemoComponentDefinition} definition Component definition.
 * @param {Record<string, string>} props Current field values.
 * @param {(props: Record<string, string>) => void} onChange Function to call with new values.
 * @returns {HTMLElement} Wrapper element.
 */
const renderForm = ({ label, icon, inline, fields }, props, onChange) => {
  const wrapper = document.createElement(inline ? 'span' : 'div');
  const title = document.createElement('span');
  const values = { ...props };

  wrapper.className = `demo-component ${inline ? 'inline' : 'block'}`;
  title.className = 'title';
  title.textContent = label;
  title.dataset.icon = icon;
  wrapper.append(title);

  fields.forEach(({ name, label: fieldLabel, options, multiline }) => {
    const field = document.createElement('label');
    /** @type {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} */
    let input;

    if (options) {
      input = document.createElement('select');
      input.append(...options.map((option) => new Option(option, option)));
    } else if (multiline) {
      input = document.createElement('textarea');
      input.rows = 2;
    } else {
      input = document.createElement('input');
    }

    input.value = values[name] ?? '';
    input.addEventListener('input', () => {
      values[name] = input.value;
      onChange({ ...values });
    });
    field.append(`${fieldLabel} `, input);
    wrapper.append(field);
  });

  // Keep the key strokes and clipboard events in the form away from Lexical
  ['keydown', 'keypress', 'beforeinput', 'input', 'paste', 'cut', 'copy', 'drop'].forEach(
    (type) => {
      wrapper.addEventListener(type, (event) => event.stopPropagation());
    },
  );

  return wrapper;
};

/**
 * Create an editor component from the given definition.
 * @param {DemoComponentDefinition} definition Component definition.
 * @param {object} markdown Markdown handling.
 * @param {RegExp} markdown.pattern Pattern matching the component in Markdown. It must have named
 * capture groups for the fields. A pattern starting with `^` and ending with `$` is a block
 * spanning multiple lines, which may contain a `body` group spanning the lines in between.
 * @returns {TextEditorComponent} Component.
 */
const createComponent = (definition, { pattern }) => {
  const { id, label, icon, trigger, inline, defaults, toBlock, fromBlock } = definition;

  /**
   * Get the field values from a Markdown match.
   * @param {RegExpMatchArray} match Match.
   * @returns {Record<string, string>} Field values.
   */
  const getProps = ({ groups = {} }) => ({
    ...defaults,
    ...(fromBlock ? fromBlock(groups) : groups),
  });

  /**
   * Decorator node for the component.
   * @augments {DecoratorNode<null>}
   */
  class ComponentNode extends DecoratorNode {
    /** @type {Record<string, string>} */
    __props;

    /**
     * Create a new node.
     * @param {Record<string, string>} [props] Field values.
     * @param {string} [key] Node key.
     */
    constructor(props = { ...defaults }, key = undefined) {
      super(key);
      this.__props = props;
    }

    /**
     * Get the node type.
     * @returns {string} Type.
     */
    static getType() {
      return id;
    }

    /**
     * Clone the given node.
     * @param {ComponentNode} node Node.
     * @returns {ComponentNode} New node.
     */
    static clone(node) {
      return new ComponentNode(node.__props, node.__key);
    }

    /**
     * Import JSON.
     * @param {any} serializedNode Serialized node.
     * @returns {ComponentNode} New node.
     */
    static importJSON(serializedNode) {
      return new ComponentNode(serializedNode.props);
    }

    /**
     * Export JSON.
     * @returns {any} Serialized node.
     */
    exportJSON() {
      return { type: id, version: 1, props: this.__props };
    }

    /**
     * Whether the node is inline.
     * @returns {boolean} Result.
     */
    isInline() {
      return inline;
    }

    /**
     * Create the DOM.
     * @param {any} _config Editor config.
     * @param {LexicalEditor} editor Editor.
     * @returns {HTMLElement} Element.
     */
    createDOM(_config, editor) {
      return renderForm(definition, this.__props, (props) => {
        editor.update(() => {
          this.getWritable().__props = props;
        });
      });
    }

    /**
     * The form updates itself, so the DOM never has to be recreated.
     * @returns {boolean} Result.
     */
    updateDOM() {
      return false;
    }

    /**
     * Nothing to decorate, as the form is rendered in {@link createDOM}.
     * @returns {null} Nothing.
     */
    decorate() {
      return null;
    }
  }

  /**
   * Export a node to Markdown.
   * @param {LexicalNode} node Node.
   * @returns {string | null} Markdown, if the node is a component node.
   */
  const exportNode = (node) =>
    node instanceof ComponentNode ? toBlock({ ...defaults, ...node.__props }) : null;

  return {
    id,
    label,
    icon,
    trigger,
    node: /** @type {any} */ (ComponentNode),
    createNode: (props) => new ComponentNode({ ...defaults, ...props }),
    transformer: inline
      ? {
          type: 'text-match',
          dependencies: [ComponentNode],
          importRegExp: pattern,
          regExp: new RegExp(`${pattern.source}$`),
          replace: (textNode, match) => {
            textNode.replace(new ComponentNode(getProps(match)));
          },
          export: exportNode,
        }
      : {
          type: 'multiline-element',
          dependencies: [ComponentNode],
          // Every line is checked, because the pattern may span multiple lines
          regExpStart: /^./,
          handleImportAfterStartMatch: ({ lines, rootNode, startLineIndex }) => {
            const rest = lines.slice(startLineIndex).join('\n');
            const match = rest.match(pattern);

            if (!match || match.index !== 0) {
              return null;
            }

            rootNode.append(new ComponentNode(getProps(match)));

            return [true, startLineIndex + match[0].split('\n').length - 1];
          },
          replace: () => false,
          export: exportNode,
        },
  };
};

/**
 * An image, inserted inline like the built-in image component of Sveltia CMS.
 */
export const imageComponent = {
  ...createComponent(
    {
      id: 'demo-image',
      label: 'Image',
      icon: 'image',
      trigger: 'button',
      inline: true,
      fields: [
        { name: 'src', label: 'URL' },
        { name: 'alt', label: 'Alt Text' },
      ],
      defaults: { src: '', alt: '' },
      toBlock: ({ src, alt }) => (src ? `![${alt}](${src})` : ''),
    },
    { pattern: /!\[(?<alt>[^\]]*)\]\((?<src>[^)\s]+)\)/ },
  ),
  // `toBlock()` gives nothing without an image URL, so provide the empty markup to be filled in the
  // plain text mode
  createMarkdown: () => '![]()',
};

/**
 * Escape a value for a double-quoted shortcode attribute.
 * @param {string} value Value.
 * @returns {string} Escaped value.
 */
const escapeAttr = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
/**
 * Unescape a value escaped with {@link escapeAttr}.
 * @param {string} value Escaped value.
 * @returns {string} Value.
 */
const unescapeAttr = (value) => value.replaceAll('&quot;', '"').replaceAll('&amp;', '&');

/**
 * An image with a caption, as a single-line block, like a Hugo shortcode.
 */
export const figureComponent = createComponent(
  {
    id: 'demo-figure',
    label: 'Image with Caption',
    icon: 'photo',
    trigger: 'menuitem',
    inline: false,
    fields: [
      { name: 'src', label: 'URL' },
      { name: 'caption', label: 'Caption' },
    ],
    defaults: { src: '', caption: '' },
    toBlock: ({ src, caption }) =>
      `{{< image src="${escapeAttr(src)}" caption="${escapeAttr(caption)}" >}}`,
    fromBlock: ({ src, caption }) => ({ src: unescapeAttr(src), caption: unescapeAttr(caption) }),
  },
  { pattern: /^\{\{< image src="(?<src>[^"]*)" caption="(?<caption>[^"]*)" >\}\}$/m },
);

/**
 * A callout block spanning multiple lines.
 */
export const calloutComponent = createComponent(
  {
    id: 'demo-callout',
    label: 'Callout',
    icon: 'campaign',
    trigger: 'menuitem',
    inline: false,
    fields: [
      { name: 'type', label: 'Type', options: ['note', 'tip', 'warning'] },
      { name: 'body', label: 'Message', multiline: true },
    ],
    defaults: { type: 'note', body: '' },
    toBlock: ({ type, body }) => `:::${type}\n${body}\n:::`,
  },
  { pattern: /^:::(?<type>note|tip|warning)\n(?<body>[\s\S]*?)\n:::$/m },
);

/**
 * A YouTube embed, as a single-line block.
 */
export const youtubeComponent = {
  ...createComponent(
    {
      id: 'demo-youtube',
      label: 'YouTube',
      icon: 'smart_display',
      trigger: 'menuitem',
      inline: false,
      fields: [{ name: 'id', label: 'Video ID' }],
      defaults: { id: '' },
      toBlock: ({ id: videoId }) => (videoId ? `{{< youtube ${videoId} >}}` : ''),
    },
    { pattern: /^\{\{< youtube (?<id>[\w-]+) >\}\}$/m },
  ),
  // `toBlock()` gives nothing without a video ID, so provide a template to be filled in the plain
  // text mode
  createMarkdown: () => '{{< youtube VIDEO_ID >}}',
};
