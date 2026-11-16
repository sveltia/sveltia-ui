import { describe, expect, it } from 'vitest';
import { addImportPlaceholders, removeImportPlaceholders } from './placeholders.js';
import { expectLinearTime } from '../../../../test-utils/complexity.js';

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
