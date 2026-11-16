import { describe, expect, it } from 'vitest';
import { splitMultilineFormatting } from './formatting.js';
import { expectLinearTime } from '../../../../test-utils/complexity.js';

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

  it('should split code formatting across two or more line breaks', () => {
    expect(splitMultilineFormatting('`a\nb\nc`')).toBe('`a`\n`b`\n`c`');
    expect(splitMultilineFormatting('x `a\n  b\nc\nd` y')).toBe('x `a`\n  `b`\n`c`\n`d` y');
  });

  it('should split code formatting with two or more backticks across lines', () => {
    expect(splitMultilineFormatting('a ``b\nc`` d')).toBe('a ``b``\n``c`` d');
    // A backtick next to the fence is padded with a space, which is stripped from the code
    expect(splitMultilineFormatting('a ``b`\nc`` d')).toBe('a `` b` ``\n``c`` d');
    expect(splitMultilineFormatting('a ```b\n`c``\nd``` e')).toBe(
      'a ```b```\n``` `c`` ```\n```d``` e',
    );
  });

  it('should strip a space from both ends of a code span before splitting it across lines', () => {
    expect(splitMultilineFormatting('a ` b\nc ` d')).toBe('a `b`\n`c` d');
    expect(splitMultilineFormatting('a `` `b`\nc `` d')).toBe('a `` `b` ``\n``c`` d');
    // A space at both ends of a line is kept, padded with another one that is stripped instead
    expect(splitMultilineFormatting('a `  b \nc ` d')).toBe('a `  b  `\n`c` d');
  });

  it('should pair the backticks of code spans before splitting them across lines', () => {
    // The closing backtick of a code span isn’t the opening one of another
    // @see https://github.com/sveltia/sveltia-cms/issues/1168
    [
      '| Bold | `**bold**` | Some **bold** text |\n| Italic | `*italic*` | Some *italic* text |',
      'a `b` c\nd `e` f',
      'a \\`b c\nd` e',
      '`a\n\nb`',
      '`\na`',
      '`a\n `',
      'a`b\nc`d',
    ].forEach((value) => {
      expect(splitMultilineFormatting(value)).toBe(value);
    });

    expect(splitMultilineFormatting('a `b` `c\nd` e')).toBe('a `b` `c`\n`d` e');
    expect(splitMultilineFormatting('a `b\n\n`c\nd`')).toBe('a `b\n\n`c`\n`d`');
    expect(splitMultilineFormatting('**`a` `b\nc`**')).toBe('**`a` `b`**\n**`c`**');
  });

  it('should not split a code span across the start of another block', () => {
    [
      '- a `b\n- c` d',
      '# a `b\nc` d',
      'a `b\n# c` d',
      '> a `b\n> > c` d',
      'a `b\n> c` d',
      '| a | `b |\n| c` | d |',
      'a `b\n| c` | d |',
      '`a\n***\nb`',
      '<div>\n`a\nb`\n</div>',
      '<span>\nx `a\nb` y',
      '<pre>\nx\n\n`a\nb`\n</pre>',
      '<div>\n- `a\nb`\n</div>',
    ].forEach((value) => {
      expect(splitMultilineFormatting(value)).toBe(value);
    });

    // A list item continues on an indented line
    expect(splitMultilineFormatting('- a `b\n  c` d')).toBe('- a `b`\n  `c` d');
    // A blockquote continues on a line with the same markers
    expect(splitMultilineFormatting('> a `b\n> c` d')).toBe('> a `b`\n> `c` d');
  });

  it('should pair the backticks of code spans in linear time', () => {
    expectLinearTime(
      (size) => `${'`a\nb` '.repeat(size)}`,
      (value) => splitMultilineFormatting(value),
      2000,
    );
    expectLinearTime(
      (size) => `${'`` a\n'.repeat(size)}\`b\nc\``,
      (value) => splitMultilineFormatting(value),
      2000,
    );
  });

  it('should split a code span or a link within formatting across lines', () => {
    expect(splitMultilineFormatting('**a `c\nd` b**')).toBe('**a `c`**\n**`d` b**');
    expect(splitMultilineFormatting('_a `b\nc`_')).toBe('_a `b`_\n_`c`_');
    expect(splitMultilineFormatting('**[a\nb](u "t")**')).toBe('**[a](u "t")**\n**[b](u "t")**');
  });

  it('should leave formatting alone if a line break within a code span or an image remains', () => {
    expect(splitMultilineFormatting('**a `\nb` e**')).toBe('**a `\nb` e**');
    expect(splitMultilineFormatting('**![a\nb](u)**')).toBe('**![a\nb](u)**');
  });

  it('should only split a link within formatting, and not in a code span', () => {
    expect(splitMultilineFormatting('<div>\n[a\nb](u)\n</div>')).toBe('<div>\n[a\nb](u)\n</div>');
    // The code span is split as code, not as a link
    expect(splitMultilineFormatting('``[a\nb](u)``')).toBe('``[a``\n``b](u)``');
    expect(splitMultilineFormatting('**``[a\nb](u)``**')).toBe('**``[a``\n``b](u)``**');
    expect(splitMultilineFormatting('**[a\nb][r]**')).toBe('**[a\nb][r]**');
    // A link after an escaped backslash, which isn’t escaped
    expect(splitMultilineFormatting('**\\\\[a\nb](u)**')).toBe('**\\\\[a](u)**\n**[b](u)**');
    expect(splitMultilineFormatting('**x \\\\[a\nb][r]**')).toBe('**x \\\\[a\nb][r]**');
    expect(splitMultilineFormatting('**\\[a\nb](u)**')).toBe('**\\[a**\n**b](u)**');
  });

  it('should split a link outside formatting across lines', () => {
    expect(splitMultilineFormatting('a [b\nc](u) d')).toBe('a [b](u)\n[c](u) d');
    expect(splitMultilineFormatting('a [b\nc](u "t") d')).toBe('a [b](u "t")\n[c](u "t") d');
    expect(splitMultilineFormatting('a [b\nc\nd](u) e')).toBe('a [b](u)\n[c](u)\n[d](u) e');
    expect(splitMultilineFormatting('a [b  \n  c `d`](u)')).toBe('a [b](u)  \n  [c `d`](u)');
    expect(splitMultilineFormatting('- [a\n  b](u)')).toBe('- [a](u)\n  [b](u)');
    [
      '![a\nb](u)',
      '\\[a\nb](u)',
      '[a\\\nb](u)',
      '[a `b\n`](u)',
      '`[a`\nb](u)',
      '[a\n- b](u)',
      '[a\n\nb](u)',
      '[a\nb][r]',
    ].forEach((value) => {
      expect(splitMultilineFormatting(value)).toBe(value);
    });
  });

  it('should split links across lines in linear time', () => {
    expectLinearTime(
      (size) => `${'[a\n'.repeat(size)}b](u)`,
      (value) => splitMultilineFormatting(value),
      2000,
    );
    expectLinearTime(
      (size) => `[a${' '.repeat(size)}\nb](u)`,
      (value) => splitMultilineFormatting(value),
      4000,
    );
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

  it('should split formatting, code spans and links in a blockquote across lines', () => {
    expect(splitMultilineFormatting('> **a\n> b**')).toBe('> **a**\n> **b**');
    expect(splitMultilineFormatting('> _a\n> b_')).toBe('> _a_\n> _b_');
    expect(splitMultilineFormatting('> `a\n> b`')).toBe('> `a`\n> `b`');
    expect(splitMultilineFormatting('> [a\n> b](u)')).toBe('> [a](u)\n> [b](u)');
    expect(splitMultilineFormatting('> > x **a\n> > b\n> > c** y')).toBe(
      '> > x **a**\n> > **b**\n> > **c** y',
    );
    expect(splitMultilineFormatting('>**a\n>  b**')).toBe('>**a**\n>  **b**');
    // A lazy continuation line, and an indented one, which isn’t a blockquote
    expect(splitMultilineFormatting('> **a\nb**')).toBe('> **a**\n**b**');
    expect(splitMultilineFormatting('**a\n    > b**')).toBe('**a**\n    **> b**');
    // A line in another blockquote, or one that starts another block in the blockquote
    ['**a\n> b**', '> **a\n> > b**', '> > **a\n> b**', '> **a\n> # b**', '> **a\n>\n> b**'].forEach(
      (value) => {
        expect(splitMultilineFormatting(value)).toBe(value);
      },
    );
  });

  it('should split formatting in a blockquote across many lines in linear time', () => {
    expectLinearTime(
      (size) => `> **${'a\n> '.repeat(size)}b**`,
      (value) => splitMultilineFormatting(value),
      2000,
    );
    expectLinearTime(
      (size) => `**a\n${'> '.repeat(size)}b`,
      (value) => splitMultilineFormatting(value),
      2000,
    );
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
