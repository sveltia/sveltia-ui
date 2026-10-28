import { describe, expect, it } from 'vitest';
import {
  addImportPlaceholders,
  convertSetextHeadings,
  convertTildeFences,
  padBlankBlockquoteLines,
  removeImportPlaceholders,
  splitMultilineFormatting,
  trimBlankBlockquoteLines,
} from './markdown.js';
import { INFO_BACKTICK } from './transformers/code.js';
import { expectLinearTime } from '../../test-utils/complexity.js';

describe('splitMultilineFormatting', () => {
  it('should split italic formatting across lines', () => {
    expect(splitMultilineFormatting('  _foo\nbar_  ')).toBe('  _foo_\n_bar_  ');
  });

  it('should split bold formatting across lines', () => {
    expect(splitMultilineFormatting('  **foo\nbar**  ')).toBe('  **foo**\n**bar**  ');
  });

  it('should split strikethrough formatting across lines', () => {
    expect(splitMultilineFormatting('  ~~foo\nbar~~  ')).toBe('  ~~foo~~\n~~bar~~  ');
  });

  it('should split code formatting across lines', () => {
    expect(splitMultilineFormatting('  `foo\nbar`  ')).toBe('  `foo`\n`bar`  ');
  });

  it('should split a code span or a link within formatting across lines', () => {
    expect(splitMultilineFormatting('**a `c\nd` b**')).toBe('**a `c`**\n**`d` b**');
    expect(splitMultilineFormatting('_a `b\nc`_')).toBe('_a `b`_\n_`c`_');
    expect(splitMultilineFormatting('**[a\nb](u "t")**')).toBe('**[a](u "t")**\n**[b](u "t")**');
  });

  it('should leave formatting alone if a line break within a code span or an image remains', () => {
    expect(splitMultilineFormatting('**a `b\nc\nd` e**')).toBe('**a `b\nc\nd` e**');
    expect(splitMultilineFormatting('**![a\nb](u)**')).toBe('**![a\nb](u)**');
  });

  it('should only split a link within formatting, and not in a code span', () => {
    expect(splitMultilineFormatting('<div>\n[a\nb](u)\n</div>')).toBe('<div>\n[a\nb](u)\n</div>');
    expect(splitMultilineFormatting('``[a\nb](u)``')).toBe('``[a\nb](u)``');
    expect(splitMultilineFormatting('**``[a\nb](u)``**')).toBe('**``[a\nb](u)``**');
    expect(splitMultilineFormatting('**[a\nb][r]**')).toBe('**[a\nb][r]**');
    // A link after an escaped backslash, which isn’t escaped
    expect(splitMultilineFormatting('**\\\\[a\nb](u)**')).toBe('**\\\\[a](u)**\n**[b](u)**');
    expect(splitMultilineFormatting('**x \\\\[a\nb][r]**')).toBe('**x \\\\[a\nb][r]**');
    expect(splitMultilineFormatting('**\\[a\nb](u)**')).toBe('**\\[a**\n**b](u)**');
  });

  it('should handle multiple formatting types', () => {
    expect(
      splitMultilineFormatting('  _italic\ntext_   **bold\ntext**  ~~strike\nthrough~~  '),
    ).toBe('  _italic_\n_text_   **bold**\n**text**  ~~strike~~\n~~through~~  ');
  });

  it('should leave a match from the end of a line to the start of the next one alone', () => {
    // These used to never finish, as each split added markers that matched again
    [
      '**_(a)_**\n**_(b)_**',
      '**_[a](https://example.com/1)_**\n**_[b](https://example.com/2)_**',
    ].forEach((value) => {
      expect(splitMultilineFormatting(value)).toBe(value);
    });

    expect(splitMultilineFormatting('**_foo\nbar_**')).toBe('**_foo_**\n**_bar_**');
  });

  it('should not affect properly formatted single-line text', () => {
    expect(splitMultilineFormatting('_italic_ **bold** ~~strike~~ `code`')).toBe(
      '_italic_ **bold** ~~strike~~ `code`',
    );
  });

  it('should split formatting at the start or the end of the value or next to punctuation', () => {
    expect(splitMultilineFormatting('_foo\nbar_')).toBe('_foo_\n_bar_');
    expect(splitMultilineFormatting('**foo\nbar**')).toBe('**foo**\n**bar**');
    expect(splitMultilineFormatting('a **foo\nbar**')).toBe('a **foo**\n**bar**');
    expect(splitMultilineFormatting('**foo\nbar** a')).toBe('**foo**\n**bar** a');
    expect(splitMultilineFormatting('(~~foo\nbar~~).')).toBe('(~~foo~~\n~~bar~~).');
    expect(splitMultilineFormatting('**foo\nbar**\n\nbaz')).toBe('**foo**\n**bar**\n\nbaz');
  });

  it('should not split underscores within a word, escaped markers or other markers', () => {
    expect(splitMultilineFormatting('snake_case\nfoo_bar')).toBe('snake_case\nfoo_bar');
    expect(splitMultilineFormatting('__foo\nbar__baz')).toBe('__foo\nbar__baz');
    expect(splitMultilineFormatting('baz__foo\nbar__')).toBe('baz__foo\nbar__');
    expect(splitMultilineFormatting('\\_foo\nbar\\_')).toBe('\\_foo\nbar\\_');
    expect(splitMultilineFormatting('\\*\\*foo\nbar\\*\\*')).toBe('\\*\\*foo\nbar\\*\\*');
    expect(splitMultilineFormatting('**foo\nbar__')).toBe('**foo\nbar__');
  });

  it('should split asterisks within a word unless the text has punctuation there', () => {
    expect(splitMultilineFormatting('**foo\nbar**baz')).toBe('**foo**\n**bar**baz');
    expect(splitMultilineFormatting('baz**foo\nbar**')).toBe('baz**foo**\n**bar**');
    expect(splitMultilineFormatting('2*3\n4*5')).toBe('2*3*\n*4*5');
    expect(splitMultilineFormatting('**foo\nbar.**baz')).toBe('**foo\nbar.**baz');
    expect(splitMultilineFormatting('baz**.foo\nbar**')).toBe('baz**.foo\nbar**');
  });

  it('should split double underscores and bold italic formatting', () => {
    expect(splitMultilineFormatting('__foo\nbar__')).toBe('__foo__\n__bar__');
    expect(splitMultilineFormatting('***foo\nbar***')).toBe('***foo***\n***bar***');
    expect(splitMultilineFormatting('___foo\nbar___')).toBe('___foo___\n___bar___');
    expect(splitMultilineFormatting('*foo\nbar*')).toBe('*foo*\n*bar*');
  });

  it('should split nested formatting from the inside', () => {
    expect(splitMultilineFormatting('**_foo\nbar_**')).toBe('**_foo_**\n**_bar_**');
    expect(splitMultilineFormatting('_**foo\nbar**_')).toBe('_**foo**_\n_**bar**_');
    expect(splitMultilineFormatting('~~**foo\nbar**~~')).toBe('~~**foo**~~\n~~**bar**~~');
    expect(splitMultilineFormatting('**_foo\nbar**')).toBe('**_foo**\n**bar**');
  });

  it('should read the backslash escapes in the text', () => {
    expect(splitMultilineFormatting('_foo\\_bar\nbaz_')).toBe('_foo\\_bar_\n_baz_');
    expect(splitMultilineFormatting('_foo\\\\\nbar_')).toBe('_foo\\\\_\n_bar_');
    expect(splitMultilineFormatting('_foo\\\\\\\nbar_')).toBe('_foo\\\\_\\\n_bar_');
    expect(splitMultilineFormatting('_foo\\\nbar_')).toBe('_foo_\\\n_bar_');
  });

  it('should keep the whitespace and hard line breaks outside the markers', () => {
    expect(splitMultilineFormatting('a _foo  \nbar_ b')).toBe('a _foo_  \n_bar_ b');
    expect(splitMultilineFormatting('**foo\\\n  bar**')).toBe('**foo**\\\n  **bar**');
    expect(splitMultilineFormatting('a _ foo\nbar_ b')).toBe('a _ foo\nbar_ b');
  });

  it('should handle formatting at different indentation levels', () => {
    expect(splitMultilineFormatting('    _foo\nbar_    ')).toBe('    _foo_\n_bar_    ');
  });

  it('should leave formatting in fenced code blocks alone', () => {
    const code = '```md\nSome _italic\ntext_ here\n```\n~~~py\nx = 2 **a\nb** 3\n~~~';

    expect(splitMultilineFormatting(code)).toBe(code);
    expect(splitMultilineFormatting(`a _b\nc_ d\n${code}\ne _f\ng_ h`)).toBe(
      `a _b_\n_c_ d\n${code}\ne _f_\n_g_ h`,
    );
  });

  it('should leave formatting in an unclosed fenced code block alone', () => {
    expect(splitMultilineFormatting('a _b\nc_ d\n```\nx _y\nz_ w')).toBe(
      'a _b_\n_c_ d\n```\nx _y\nz_ w',
    );
  });

  it('should process formatting after a line with a backtick after three backticks', () => {
    // Inline code, not a code block, like ```` ``` ```` in ```` ```` ``` ```` ````
    expect(splitMultilineFormatting('```a``` _b\nc_ d')).toBe('```a``` _b_\n_c_ d');
  });

  it('should split formatting across two or more line breaks', () => {
    expect(splitMultilineFormatting('**a\nb\nc**')).toBe('**a**\n**b**\n**c**');
    expect(splitMultilineFormatting('x _a\nb\nc_ y')).toBe('x _a_\n_b_\n_c_ y');
    expect(splitMultilineFormatting('~~a\nb\nc\nd~~')).toBe('~~a~~\n~~b~~\n~~c~~\n~~d~~');
    expect(splitMultilineFormatting('__a\nb\nc__ ***d\ne\nf***')).toBe(
      '__a__\n__b__\n__c__ ***d***\n***e***\n***f***',
    );
    expect(splitMultilineFormatting('_a  \n  b\\\\\n c\\\nd_')).toBe(
      '_a_  \n  _b\\\\_\n _c_\\\n_d_',
    );
  });

  it('should split nested formatting across two or more line breaks from the inside', () => {
    expect(splitMultilineFormatting('**_a\nb\nc_**')).toBe('**_a_**\n**_b_**\n**_c_**');
    expect(splitMultilineFormatting('**_a\nb_\nc**')).toBe('**_a_**\n**_b_**\n**c**');
    expect(splitMultilineFormatting('~~a\n**b\nc**\nd~~')).toBe(
      '~~a~~\n~~**b**~~\n~~**c**~~\n~~d~~',
    );
  });

  it('should not split formatting across a line that starts a block', () => {
    expect(splitMultilineFormatting('**a\n# b\nc**')).toBe('**a\n# b\nc**');
    expect(splitMultilineFormatting('_a\n- b_')).toBe('_a\n- b_');
    expect(splitMultilineFormatting('**a\n    b**')).toBe('**a**\n    **b**');
  });

  it('should split formatting across many lines in linear time', () => {
    expectLinearTime(
      (size) => `**${'a\n'.repeat(size)}b**`,
      (value) => splitMultilineFormatting(value),
      2000,
    );
    expectLinearTime(
      (size) => `**_a\n${'b\n'.repeat(size)}c_\nd**`,
      (value) => splitMultilineFormatting(value),
      2000,
    );
  });

  it('should process many markers and lines in linear time', () => {
    // Unclosed formatting
    expectLinearTime(
      (size) => '**a\n'.repeat(size),
      (value) => splitMultilineFormatting(value),
      2000,
    );
    expectLinearTime(
      (size) => `_a\n${'b \n'.repeat(size)}`,
      (value) => splitMultilineFormatting(value),
      2000,
    );
    expectLinearTime(
      (size) => `**a${' '.repeat(size)}b\nc**`,
      (value) => splitMultilineFormatting(value),
      4000,
    );
  });

  it('should process a long run of whitespace in linear time', () => {
    const value = `${' \n'.repeat(100_000)}x`;
    const start = performance.now();

    expect(splitMultilineFormatting(value)).toBe(value);
    // The previous regexes took several seconds on this input
    expect(performance.now() - start).toBeLessThan(500);
  });
});

describe('addImportPlaceholders', () => {
  /**
   * Add the placeholders, and show them as `<E>` for an escaped backslash, `<P>` for a period,
   * `<T>` for a tab and `<S>` for a space.
   * @param {string} value Markdown.
   * @returns {string} Result.
   */
  const mark = (value) =>
    addImportPlaceholders(value)
      .replaceAll('\uE002', '<E>')
      .replaceAll(/\.\uE003|\uE003\./g, '<P>')
      .replaceAll('\uE005', '<T>')
      .replaceAll('\uE006', '<S>')
      .replaceAll('\uE007', '<H>');

  it('should mark an escaped backslash at the end of a line', () => {
    expect(mark('a\\\\\nb')).toBe('a\\\\<E>\nb');
    expect(mark('a\\\\\\\nb')).toBe('a\\\\<E>\\\nb');
    expect(mark('_a\\\\_\n**b\\\\**')).toBe('_a\\\\<E>_\n**b\\\\<E>**');
  });

  it('should mark a backslash before the closing backticks of a code span', () => {
    expect(mark('`a\\`\n``b\\``_')).toBe('`a\\<E>`\n``b\\<E>``_');
    expect(mark('`a` b\\`\n\\`c\\`')).toBe('`a` b\\`\n\\`c\\`');
  });

  it('should mark a formatting marker before a backslash', () => {
    expect(mark('_a_\\\n__b__\\\\')).toBe('_a_<P>\\\n__b__<P>\\\\<E>');
    expect(mark('_a\\\\_\\')).toBe('_a\\\\<E>_<P>\\');
    expect(mark('x _a_\\y **b.**\\* ~~c.~~\\z')).toBe('x _a_<P>\\y **b.**<P>\\* ~~c.~~<P>\\z');
    expect(mark('a_\\_b')).toBe('a_<P>\\_b');
  });

  it('should mark a formatting marker after an escaped backslash', () => {
    expect(mark('a \\\\_b_ \\\\\\\\**c**')).toBe('a \\\\<P>_b_ \\\\\\\\<P>**c**');
  });

  it('should mark a formatting marker next to Unicode punctuation or a symbol', () => {
    expect(mark('See –**[a](u)** “_b_” ~~c~~— d*…')).toBe(
      'See –<P>**[a](u)** “<P>_b_<P>” ~~c~~<P>— d*<P>…',
    );
    expect(mark('é**a** – b – “c” **(d)**')).toBe('é**a** – b – “c” **(d)**');
  });

  it('should not mark an escaped formatting marker', () => {
    expect(mark('\\_a\\_\\b \\\\\\_c')).toBe('\\_a\\_\\b \\\\\\_c');
  });

  it('should mark the tabs in a code span', () => {
    expect(mark('`\t` a\tb ``c\td`` \\`e\tf ` \t `')).toBe('`<T>` a\tb ``c<T>d`` \\`e\tf ` <T> `');
  });

  it('should mark the spaces in a code span made only of spaces', () => {
    expect(mark('` ` a `` `  ` `` `   ` ` b `')).toBe('`<S>` a `` `  ` `` `<S><S><S>` ` b `');
  });

  it('should leave other lines alone', () => {
    const value = 'a\\\nb\\ c\n\\_a\\\n```\na\\\\\n_b_\\\n`\t`\n```';

    expect(mark(value)).toBe(value);
  });

  it('should mark the lines of an HTML block and the tabs in it', () => {
    expect(mark('<div>\n\t*a*\n</div>\n\n*b*')).toBe('<H><div>\n<H><T>*a*\n<H></div>\n\n*b*');
    expect(mark('Text\n<DIV class="x">\nmore')).toBe('Text\n<H><DIV class="x">\n<H>more');
  });

  it('should end an HTML block of a raw text element, a comment and the like at its end', () => {
    [
      ['<script>', '</script>'],
      ['<!-- a', 'b -->'],
      ['<?php', '?>'],
      ['<!DOCTYPE', 'html>'],
      ['<![CDATA[', ']]>'],
    ].forEach(([start, end]) => {
      expect(mark(`${start}\n\n*a*\n${end}\n*b*`)).toBe(`<H>${start}\n<H>\n<H>*a*\n<H>${end}\n*b*`);
    });

    expect(mark('<!-- *a* -->\n*b*')).toBe('<H><!-- *a* -->\n*b*');
  });

  it('should mark a line with only a tag unless it’s in a paragraph', () => {
    expect(mark('<span title="_a">\n*b*\n\nText\n<span>')).toBe(
      '<H><span title="_a">\n<H>*b*\n\nText\n<span>',
    );
    expect(mark('<pre class="x">\n*a*\n</pre>')).toBe('<H><pre class="x">\n<H>*a*\n<H></pre>');
    expect(mark('<span> a')).toBe('<span> a');
  });

  it('should mark a line with only a tag after a heading or a thematic break', () => {
    expect(mark('# T\n<x-foo>\n*a*\n</x-foo>')).toBe('# T\n<H><x-foo>\n<H>*a*\n<H></x-foo>');
    expect(mark('***\n<x-foo>\n*a*')).toBe('***\n<H><x-foo>\n<H>*a*');
    expect(mark('a\n===\n<x-foo>\n*a*')).toBe('a\n===\n<H><x-foo>\n<H>*a*');
    // Not a heading underline without a paragraph line before it, but paragraph text
    expect(mark('===\n<x-foo>\n*a*')).toBe('===\n<x-foo>\n*a*');
  });

  it('should mark the tabs in inline HTML', () => {
    expect(mark('a <img\tsrc="x"\talt="y\tz"> b\tc `<i\tx>`')).toBe(
      'a <img<T>src="x"<T>alt="y<T>z"> b\tc `<i<T>x>`',
    );
  });

  it('should leave HTML in a code block alone', () => {
    const value = '```\n<div>\n\t*a*\n</div>\n```';

    expect(mark(value)).toBe(value);
  });

  it('should mark a line with many backticks in linear time', () => {
    expectLinearTime(
      (size) => `${'`a'.repeat(size)}\\\\`,
      (value) => addImportPlaceholders(value),
      2000,
    );
  });

  it('should mark a line with many backslashes and markers in linear time', () => {
    expectLinearTime(
      (size) => `${'\\\\'.repeat(size)}_${'\\'.repeat(size)}`,
      (value) => addImportPlaceholders(value),
      2000,
    );
    expectLinearTime(
      (size) => '_\\'.repeat(size),
      (value) => addImportPlaceholders(value),
      2000,
    );
  });
});

describe('removeImportPlaceholders', () => {
  it('should remove the placeholders', () => {
    expect(removeImportPlaceholders(addImportPlaceholders('_a\\\\_\\'))).toBe('_a\\\\_\\');
    expect(removeImportPlaceholders(addImportPlaceholders('`\t` ` ` _a_\\b'))).toBe(
      '`\t` ` ` _a_\\b',
    );
    expect(removeImportPlaceholders('a b.')).toBe('a b.');
    expect(removeImportPlaceholders(addImportPlaceholders('<div>\n\ta\n</div>'))).toBe(
      '<div>\n\ta\n</div>',
    );
  });
});

describe('padBlankBlockquoteLines', () => {
  it('should add a trailing space to a blank blockquote line', () => {
    expect(padBlankBlockquoteLines('> "A quotation."\n>\n> **Attribution**, Title')).toBe(
      '> "A quotation."\n> \n> **Attribution**, Title',
    );
  });

  it('should pad every blank blockquote line', () => {
    expect(padBlankBlockquoteLines('> a\n>\n>\n> b\n\ntext\n\n>\n> c')).toBe(
      '> a\n> \n> \n> b\n\ntext\n\n> \n> c',
    );
  });

  it('should not affect blockquote lines that already have content or a trailing space', () => {
    expect(padBlankBlockquoteLines('> a\n> \n> >\n> b')).toBe('> a\n> \n> >\n> b');
  });

  it('should not affect a `>` that is not at the start of a line', () => {
    expect(padBlankBlockquoteLines('a > b\n >')).toBe('a > b\n >');
  });

  it('should return unchanged string if there is no blank blockquote line', () => {
    expect(padBlankBlockquoteLines('> a\n> b')).toBe('> a\n> b');
  });

  it('should not modify lines inside a fenced code block', () => {
    expect(padBlankBlockquoteLines('>\n```\n>\n```\n>')).toBe('> \n```\n>\n```\n> ');
    expect(padBlankBlockquoteLines('~~~\n>\n~~~')).toBe('~~~\n>\n~~~');
  });

  it('should not modify lines inside an indented fenced code block', () => {
    expect(padBlankBlockquoteLines('>\n  ```\n>\n  ```\n>')).toBe('> \n  ```\n>\n  ```\n> ');
  });

  it('should not modify lines inside a tilde fenced code block', () => {
    expect(padBlankBlockquoteLines('>\n~~~\n>\n~~~\n>')).toBe('> \n~~~\n>\n~~~\n> ');
  });

  it('should handle multiple fenced code blocks', () => {
    expect(padBlankBlockquoteLines('>\n```\n>\n```\n>\n```\n>\n```\n>')).toBe(
      '> \n```\n>\n```\n> \n```\n>\n```\n> ',
    );
  });

  it('should not end a code block at a shorter or different fence within it', () => {
    expect(padBlankBlockquoteLines('````\n```\n>\n~~~\n>\n````\n>')).toBe(
      '````\n```\n>\n~~~\n>\n````\n> ',
    );
  });

  it('should not end a code block at a fence followed by an info string', () => {
    expect(padBlankBlockquoteLines('```\n```js\n>\n```\n>')).toBe('```\n```js\n>\n```\n> ');
  });
});

describe('trimBlankBlockquoteLines', () => {
  it('should remove the trailing space from a blank blockquote line', () => {
    expect(trimBlankBlockquoteLines('> "A quotation."\n> \n> **Attribution**, Title')).toBe(
      '> "A quotation."\n>\n> **Attribution**, Title',
    );
  });

  it('should trim every blank blockquote line', () => {
    expect(trimBlankBlockquoteLines('> a\n> \n> \n> b\n\ntext\n\n> \n> c')).toBe(
      '> a\n>\n>\n> b\n\ntext\n\n>\n> c',
    );
  });

  it('should not affect blockquote lines with content', () => {
    expect(trimBlankBlockquoteLines('> a \n> >\n> b')).toBe('> a \n> >\n> b');
  });

  it('should return unchanged string if there is no blank blockquote line', () => {
    expect(trimBlankBlockquoteLines('> a\n> b')).toBe('> a\n> b');
  });

  it('should not modify lines inside a fenced code block', () => {
    expect(trimBlankBlockquoteLines('> \n```\n> \n```\n> ')).toBe('>\n```\n> \n```\n>');
  });
});

describe('convertTildeFences', () => {
  it('should leave a value without tilde fences as is', () => {
    expect(convertTildeFences('```js\ncode\n```\n\n~~strike~~')).toBe(
      '```js\ncode\n```\n\n~~strike~~',
    );
  });

  it('should convert tilde fences to backtick fences', () => {
    expect(convertTildeFences('a\n\n~~~py\nprint(1)\n~~~\n\nb\n\n  ~~~~\n  x\n  ~~~~~')).toBe(
      'a\n\n```py\nprint(1)\n```\n\nb\n\n  ```\n  x\n  ```',
    );
  });

  it('should make the fence longer than the backtick fences in the code', () => {
    expect(convertTildeFences('~~~md\n```js\ncode\n```\n  ````\n~~~')).toBe(
      '`````md\n```js\ncode\n```\n  ````\n`````',
    );
  });

  it('should convert the opening fence of an unclosed code block', () => {
    expect(convertTildeFences('~~~\ncode\n~~')).toBe('```\ncode\n~~');
  });

  it('should replace backticks after the language in the info string with a placeholder', () => {
    expect(convertTildeFences('~~~js `a`\ncode\n~~~')).toBe(
      `\`\`\`js ${INFO_BACKTICK}a${INFO_BACKTICK}\ncode\n\`\`\``,
    );
  });

  it('should remove backticks from an info string without a language', () => {
    expect(convertTildeFences('~~~`js`\ncode\n~~~')).toBe('```js\ncode\n```');
  });

  it('should leave a tilde fence within a backtick code block alone', () => {
    expect(convertTildeFences('```\n~~~\ncode\n~~~\n```')).toBe('```\n~~~\ncode\n~~~\n```');
  });

  it('should not close a code block with a shorter or a different fence', () => {
    expect(convertTildeFences('~~~~\n~~~\n```\n~~~~')).toBe('````\n~~~\n```\n````');
  });
});

describe('convertSetextHeadings', () => {
  it('should leave a value without underlines as is', () => {
    expect(convertSetextHeadings('# Title\n\nText')).toBe('# Title\n\nText');
  });

  it('should convert a setext heading starting with inline HTML, but not after an HTML block', () => {
    expect(convertSetextHeadings('<span>Title</span>\n=====')).toBe('# <span>Title</span>');
    expect(convertSetextHeadings('Intro\n\n<div>\nx\n</div>\n---')).toBe(
      'Intro\n\n<div>\nx\n</div>\n---',
    );
  });

  it('should convert setext headings to ATX headings', () => {
    expect(convertSetextHeadings('Title\n=====\n\nSub  \n---\n\nText')).toBe(
      '# Title\n\n## Sub\n\nText',
    );
  });

  it('should join the lines of a multiline heading', () => {
    expect(convertSetextHeadings('Long\n title\n===')).toBe('# Long title');
  });

  it('should convert a heading after an ATX heading or a code block', () => {
    expect(convertSetextHeadings('# A\nB\n---\n```\ncode\n```\nC\n===')).toBe(
      '# A\n## B\n```\ncode\n```\n# C',
    );
  });

  it('should leave a horizontal rule after a blank line or another block as is', () => {
    expect(convertSetextHeadings('Text\n\n---\n\n- item\n---\n\n> quote\n---\n\n===')).toBe(
      'Text\n\n---\n\n- item\n---\n\n> quote\n---\n\n===',
    );
  });

  it('should leave a paragraph after a block other than a heading as is', () => {
    expect(convertSetextHeadings('- item\nlazy\n---\n\n| a |\nb\n===')).toBe(
      '- item\nlazy\n---\n\n| a |\nb\n===',
    );
  });

  it('should leave a block like front matter as is', () => {
    expect(convertSetextHeadings('Text\n\n---\ntitle: x\n---\n\nMore')).toBe(
      'Text\n\n---\ntitle: x\n---\n\nMore',
    );
  });

  it('should leave the lines in a code block alone', () => {
    expect(convertSetextHeadings('```\nTitle\n===\n```\n~~~\nSub\n---\n~~~')).toBe(
      '```\nTitle\n===\n```\n~~~\nSub\n---\n~~~',
    );
  });
});
