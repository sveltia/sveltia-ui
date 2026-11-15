import {
  $createLineBreakNode as createLineBreakNode,
  $createParagraphNode as createParagraphNode,
  $createTextNode as createTextNode,
  $getRoot as getRoot,
} from 'lexical';
import { afterEach, describe, expect, it } from 'vitest';
import { convertHtmlToLexical } from '../import.js';
import { exportHtml } from './index.js';
import {
  CaptionedImageNode,
  createEditorWithComponents,
  disposeEditors,
  VideoNode,
} from '#lib/test-utils/html-editor.js';

afterEach(disposeEditors);

describe('block-level elements of inline editor components in HTML', () => {
  const FIGURE = '<figure class="caption"><img src="a.png"><figcaption>A</figcaption></figure>';
  const VIDEO = '<video src="a.mp4"></video>';

  /**
   * Create an editor with a paragraph holding the given text nodes and editor components.
   * @param {(string | null | { bold: string } | { html: string } | { lineBreak: true })[]} children
   * Text, `null` for a captioned image component, bold text, an inline component exporting the
   * given HTML, or a line break.
   * @param {object} [options] Options.
   * @param {boolean} [options.aligned] Whether the paragraph is centred.
   * @returns {string} Exported HTML.
   */
  const exportParagraph = (children, { aligned = false } = {}) => {
    const editor = createEditorWithComponents();

    editor.update(
      () => {
        const paragraph = createParagraphNode();

        if (aligned) {
          paragraph.setFormat('center');
        }

        children.forEach((child) => {
          if (child === null) {
            const node = new CaptionedImageNode();

            node.__html = FIGURE;
            paragraph.append(node);
          } else if (typeof child === 'string') {
            paragraph.append(createTextNode(child));
          } else if ('bold' in child) {
            paragraph.append(createTextNode(child.bold).setFormat('bold'));
          } else if ('lineBreak' in child) {
            paragraph.append(createLineBreakNode());
          } else {
            const node = new VideoNode();

            node.__html = child.html;
            paragraph.append(node);
          }
        });

        getRoot().append(createParagraphNode().append(createTextNode('Intro.')), paragraph);
      },
      { discrete: true },
    );

    return editor.read(() => exportHtml(editor));
  };

  it('should leave out the paragraph holding nothing but block-level elements', () => {
    expect(exportParagraph([null])).toBe(`<p>Intro.</p>${FIGURE}`);
    // The whitespace between them is dropped, as the HTML parser ignores it
    expect(exportParagraph([' ', null, ' ', null, ' '])).toBe(`<p>Intro.</p>${FIGURE}${FIGURE}`);
  });

  it('should split the paragraph holding text as well around the block-level elements', () => {
    expect(exportParagraph(['See ', null])).toBe(`<p>Intro.</p><p>See</p>${FIGURE}`);
    expect(exportParagraph(['A ', null, ' B ', null, ' C'])).toBe(
      `<p>Intro.</p><p>A</p>${FIGURE}<p>B</p>${FIGURE}<p>C</p>`,
    );
  });

  it('should drop the whitespace within an inline element next to the split', () => {
    expect(exportParagraph([{ bold: ' See ' }, null, { bold: ' more ' }])).toBe(
      `<p>Intro.</p><p><strong>See</strong></p>${FIGURE}<p><strong>more</strong></p>`,
    );

    // Nothing is left of whitespace alone
    expect(exportParagraph([null, { bold: ' ' }])).toBe(`<p>Intro.</p>${FIGURE}`);
    // Preformatted whitespace is kept
    expect(exportParagraph([null, { html: '<span style="white-space: pre;">  x  </span>' }])).toBe(
      `<p>Intro.</p>${FIGURE}<p><span style="white-space: pre;">  x  </span></p>`,
    );
    // A line break is content, though
    expect(exportParagraph([null, { lineBreak: true }])).toBe(
      `<p>Intro.</p>${FIGURE}<p><br><br></p>`,
    );
  });

  it('should keep an element a paragraph can hold, like a video', () => {
    expect(exportParagraph(['Watch ', { html: VIDEO }, ' now'])).toBe(
      `<p>Intro.</p><p>Watch ${VIDEO} now</p>`,
    );
  });

  it('should keep the alignment of the text split from an aligned paragraph', () => {
    expect(exportParagraph(['A', null, 'B'], { aligned: true })).toBe(
      '<p>Intro.</p><p style="text-align: center;">A</p>' +
        `${FIGURE}<p style="text-align: center;">B</p>`,
    );
  });

  it('should keep the HTML it exports from a split paragraph as is', async () => {
    const html = `<p>Intro.</p><p>A</p>${FIGURE}<p>B</p>`;

    expect(await convertHtmlToLexical(createEditorWithComponents(), html)).toBe(html);
  });

  it('should keep the HTML it exports as is', async () => {
    const html = `<p>Intro.</p>${FIGURE}<p>Outro.</p>`;

    expect(await convertHtmlToLexical(createEditorWithComponents(), html)).toBe(html);
  });
});
