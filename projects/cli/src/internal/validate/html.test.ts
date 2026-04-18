import { describe, test, expect } from 'bun:test';
import { parseHTML } from './html.js';

describe('parseHTML', () => {
  test('parses single element', () => {
    const doc = parseHTML('<div></div>');
    expect(doc.elements.length).toBe(1);
    expect(doc.elements[0].tagName).toBe('div');
    expect(doc.elements[0].line).toBe(1);
    expect(doc.elements[0].column).toBe(1);
  });

  test('parses nested elements', () => {
    const doc = parseHTML('<div><span></span></div>');
    expect(doc.elements.length).toBe(2);
    expect(doc.elements[1].parent).toBe(doc.elements[0]);
    expect(doc.elements[0].children.length).toBe(1);
  });

  test('parses attributes with positions', () => {
    const doc = parseHTML('<div class="test" id="main"></div>');
    expect(doc.elements[0].attributes.length).toBe(2);
    expect(doc.elements[0].attributes[0].name).toBe('class');
    expect(doc.elements[0].attributes[0].value).toBe('test');
    expect(doc.elements[0].attributes[0].hasValue).toBe(true);
    expect(doc.elements[0].attributes[1].name).toBe('id');
  });

  test('parses boolean attributes', () => {
    const doc = parseHTML('<input disabled>');
    expect(doc.elements[0].attributes[0].name).toBe('disabled');
    expect(doc.elements[0].attributes[0].hasValue).toBe(false);
  });

  test('tracks multiline positions', () => {
    const doc = parseHTML('<div>\n  <span>\n  </span>\n</div>');
    expect(doc.elements[0].line).toBe(1);
    expect(doc.elements[1].line).toBe(2);
  });

  test('parses style tags', () => {
    const doc = parseHTML('<style>div { color: red; }</style>');
    expect(doc.styleTags.length).toBe(1);
    expect(doc.styleTags[0].content).toContain('color: red');
  });

  test('parses self-closing tags', () => {
    const doc = parseHTML('<br><input><hr>');
    expect(doc.elements.length).toBe(3);
  });

  test('parses custom element attributes', () => {
    const doc = parseHTML('<my-element @click="handler" slot="content"></my-element>');
    expect(doc.elements[0].tagName).toBe('my-element');
    expect(doc.elements[0].attributes.length).toBe(2);
    expect(doc.elements[0].attributes[0].name).toBe('@click');
    expect(doc.elements[0].attributes[1].name).toBe('slot');
  });

  test('handles empty input', () => {
    const doc = parseHTML('');
    expect(doc.elements.length).toBe(0);
  });

  test('handles comments', () => {
    const doc = parseHTML('<!-- comment --><div></div>');
    expect(doc.elements.length).toBe(1);
    expect(doc.elements[0].tagName).toBe('div');
  });

  test('parses multiline attributes with correct positions', () => {
    const doc = parseHTML('<div\n  class="foo"\n  id="bar"></div>');
    const attrs = doc.elements[0].attributes;
    expect(attrs.length).toBe(2);
    expect(attrs[0].name).toBe('class');
    expect(attrs[0].value).toBe('foo');
    expect(attrs[0].line).toBe(2);
    expect(attrs[0].column).toBe(3);
    expect(attrs[1].name).toBe('id');
    expect(attrs[1].value).toBe('bar');
    expect(attrs[1].line).toBe(3);
    expect(attrs[1].column).toBe(3);
  });

  test('parses unquoted attribute values', () => {
    const doc = parseHTML('<div class=foo></div>');
    const attr = doc.elements[0].attributes[0];
    expect(attr.name).toBe('class');
    expect(attr.value).toBe('foo');
    expect(attr.hasValue).toBe(true);
  });

  test('parses single-quoted attribute values', () => {
    const doc = parseHTML("<div class='test'></div>");
    const attr = doc.elements[0].attributes[0];
    expect(attr.name).toBe('class');
    expect(attr.value).toBe('test');
    expect(attr.hasValue).toBe(true);
  });

  test('handles DOCTYPE', () => {
    const doc = parseHTML('<!DOCTYPE html><div></div>');
    expect(doc.elements.length).toBe(1);
    expect(doc.elements[0].tagName).toBe('div');
  });

  test('parses attributes with spaces around =', () => {
    const doc = parseHTML('<div class = "foo"></div>');
    const attr = doc.elements[0].attributes[0];
    expect(attr.name).toBe('class');
    expect(attr.value).toBe('foo');
    expect(attr.hasValue).toBe(true);
  });

  test('handles > inside quoted attribute values', () => {
    const doc = parseHTML('<div title="a > b"></div>');
    expect(doc.elements.length).toBe(1);
    expect(doc.elements[0].attributes[0].name).toBe('title');
    expect(doc.elements[0].attributes[0].value).toBe('a > b');
  });

  test('preserves single quotes inside double-quoted values', () => {
    const doc = parseHTML(`<a href="it's ok"></a>`);
    expect(doc.elements[0].attributes[0].value).toBe("it's ok");
  });

  test('preserves double quotes inside single-quoted values', () => {
    const doc = parseHTML(`<a title='she said "hi"'></a>`);
    expect(doc.elements[0].attributes[0].value).toBe('she said "hi"');
  });

  test('handles CRLF line endings for element positions', () => {
    const doc = parseHTML('\r\n\r\n<div></div>');
    expect(doc.elements[0].line).toBe(3);
    expect(doc.elements[0].column).toBe(1);
  });

  test('handles CRLF line endings for multiline attributes', () => {
    const doc = parseHTML('<div\r\n  class="foo"\r\n  id="bar"></div>');
    const [cls, id] = doc.elements[0].attributes;
    expect(cls.line).toBe(2);
    expect(cls.column).toBe(3);
    expect(id.line).toBe(3);
    expect(id.column).toBe(3);
  });

  test('parses empty attribute values', () => {
    const doc = parseHTML('<div class=""></div>');
    const attr = doc.elements[0].attributes[0];
    expect(attr.value).toBe('');
    expect(attr.hasValue).toBe(true);
  });

  test('preserves entity references without decoding', () => {
    const doc = parseHTML('<a title="a &amp; b"></a>');
    expect(doc.elements[0].attributes[0].value).toBe('a &amp; b');
  });

  test('still records unclosed tags as elements', () => {
    const doc = parseHTML('<div><span>');
    expect(doc.elements.map(e => e.tagName)).toEqual(['div', 'span']);
  });

  test('records unclosed tag attributes', () => {
    const doc = parseHTML('<div class="a"><span id="b">');
    expect(doc.elements[0].attributes[0].value).toBe('a');
    expect(doc.elements[1].attributes[0].value).toBe('b');
  });

  test('captures multiple style blocks', () => {
    const doc = parseHTML('<style>a{color:red}</style><style>b{color:blue}</style>');
    expect(doc.styleTags.length).toBe(2);
    expect(doc.styleTags[0].content).toContain('color:red');
    expect(doc.styleTags[1].content).toContain('color:blue');
  });

  test('whitespace-only input yields no elements', () => {
    const doc = parseHTML('   \n\t  ');
    expect(doc.elements.length).toBe(0);
  });

  test('handles mismatched closing tags without crashing', () => {
    const doc = parseHTML('<div><span></div></span>');
    expect(doc.elements.map(e => e.tagName)).toEqual(['div', 'span']);
    expect(doc.elements[1].parent).toBe(doc.elements[0]);
  });

  test('handles unterminated comments', () => {
    const doc = parseHTML('<div></div><!-- never closed');
    expect(doc.elements.length).toBe(1);
    expect(doc.elements[0].tagName).toBe('div');
  });
});
