import { describe, test, expect } from 'bun:test';
import { extractTagName, computeStylePosition } from './css-helpers.js';
import type { HTMLStyleTag } from '../types.js';

describe('extractTagName', () => {
  test('extracts plain tag name', () => {
    expect(extractTagName('div')).toBe('div');
  });

  test('extracts tag from pseudo-class selector', () => {
    expect(extractTagName('button:hover')).toBe('button');
  });

  test('extracts tag from pseudo-element selector', () => {
    expect(extractTagName('div::before')).toBe('div');
  });

  test('extracts tag from class selector', () => {
    expect(extractTagName('div.active')).toBe('div');
  });

  test('extracts tag from id selector', () => {
    expect(extractTagName('div#main')).toBe('div');
  });

  test('extracts tag from attribute selector', () => {
    expect(extractTagName('input[type]')).toBe('input');
  });

  test('extracts tag with descendant combinator', () => {
    expect(extractTagName('div span')).toBe('div');
  });

  test('returns class-only selector as-is', () => {
    expect(extractTagName('.active')).toBe('.active');
  });

  test('returns id-only selector as-is', () => {
    expect(extractTagName('#main')).toBe('#main');
  });

  test('handles custom element names', () => {
    expect(extractTagName('bp-button')).toBe('bp-button');
    expect(extractTagName('bp-button:hover')).toBe('bp-button');
  });
});

describe('computeStylePosition', () => {
  const makeStyle = (content: string): HTMLStyleTag => ({
    content,
    contentLine: 1,
    contentColumn: 1
  });

  test('computes position at start of content', () => {
    const pos = computeStylePosition(makeStyle('body {}'), 0);
    expect(pos).toEqual({ line: 1, col: 1 });
  });

  test('computes position on first line', () => {
    const pos = computeStylePosition(makeStyle('body { color: red; }'), 7);
    expect(pos).toEqual({ line: 1, col: 8 });
  });

  test('computes position on second line', () => {
    const style = makeStyle('body {\n  color: red;\n}');
    const offset = 'body {\n  '.length;
    const pos = computeStylePosition(style, offset);
    expect(pos).toEqual({ line: 2, col: 3 });
  });

  test('computes position with multiple newlines', () => {
    const style = makeStyle('a {\n}\nb {\n  x: 1;\n}');
    const offset = 'a {\n}\nb {\n  '.length;
    const pos = computeStylePosition(style, offset);
    expect(pos).toEqual({ line: 4, col: 3 });
  });

  test('accounts for contentLine offset', () => {
    const style: HTMLStyleTag = {
      content: 'body {}',
      contentLine: 10,
      contentColumn: 5
    };
    const pos = computeStylePosition(style, 3);
    expect(pos).toEqual({ line: 10, col: 8 });
  });
});
