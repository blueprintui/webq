import type { HTMLDocument, HTMLElement, HTMLAttribute } from './types.js';

const CHAR_DQUOTE = 34; // "
const CHAR_SQUOTE = 39; // '
const CHAR_GT = 62; // >

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
}

function isTagDelimiter(ch: string): boolean {
  return isWhitespace(ch) || ch === '>' || ch === '/';
}

/** Scan forward from `start` to find the closing `>`, respecting quoted attribute values. Returns the index of `>`, or `src.length` if not found. */
function findTagEnd(src: string, start: number): number {
  let idx = start;
  let inQuote = 0;
  while (idx < src.length) {
    const ch = src.charCodeAt(idx);
    if (inQuote) {
      if (ch === inQuote) inQuote = 0;
    } else if (ch === CHAR_DQUOTE || ch === CHAR_SQUOTE) {
      inQuote = ch;
    } else if (ch === CHAR_GT) {
      return idx;
    }
    idx++;
  }
  return idx;
}

class LineIndex {
  readonly #lineStarts: number[];

  constructor(src: string) {
    this.#lineStarts = [0];
    for (let idx = 0; idx < src.length; idx++) {
      if (src[idx] === '\n') {
        this.#lineStarts.push(idx + 1);
      }
    }
  }

  position(offset: number): { line: number; col: number } {
    let lo = 0;
    let hi = this.#lineStarts.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      if (this.#lineStarts[mid] <= offset) {
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    const line = lo; // 1-based
    const col = offset - this.#lineStarts[lo - 1] + 1;
    return { line, col };
  }
}

interface ParserState {
  src: string;
  idx: LineIndex;
  doc: HTMLDocument;
  stack: HTMLElement[];
  pos: number;
}

function captureStyleText(state: ParserState, from: number, to: number): void {
  const { stack, src, doc, idx } = state;
  if (stack.length === 0 || stack[stack.length - 1].tagName !== 'style') return;
  const textContent = src.slice(from, to);
  if (!textContent.trim()) return;
  const { line, col } = idx.position(from);
  doc.styleTags.push({ content: textContent, contentLine: line, contentColumn: col });
}

function handleComment(src: string, tagStart: number): number {
  const commentEnd = src.indexOf('-->', tagStart + 4);
  return commentEnd >= 0 ? commentEnd + 3 : -1;
}

function handleDoctype(src: string, tagStart: number): number {
  const docEnd = src.indexOf('>', tagStart);
  return docEnd >= 0 ? docEnd + 1 : -1;
}

function handleCloseTag(state: ParserState, tagStart: number): number {
  const { src, stack, idx } = state;
  const closeEnd = src.indexOf('>', tagStart);
  if (closeEnd < 0) return -1;
  const closed = stack.pop();
  if (closed) {
    const endPos = idx.position(closeEnd);
    closed.endLine = endPos.line;
    closed.endColumn = endPos.col;
  }
  return closeEnd + 1;
}

function handleOpenTag(state: ParserState, tagStart: number): number {
  const { src, idx } = state;
  let nameEnd = tagStart + 1;
  if (nameEnd >= src.length || !/[a-zA-Z]/.test(src[nameEnd])) return tagStart + 1;

  const { line, col } = idx.position(tagStart);
  while (nameEnd < src.length && !isTagDelimiter(src[nameEnd])) nameEnd++;
  const tagName = src.slice(tagStart + 1, nameEnd).toLowerCase();

  const tagEnd = findTagEnd(src, nameEnd);
  if (tagEnd >= src.length) return -1;

  const selfClosing = src[tagEnd - 1] === '/' || isVoidElement(tagName);
  const attrs = parseAttributes(src, tagStart, idx);
  const elem: HTMLElement = { tagName, attributes: attrs, children: [], line, column: col };

  pushElement(state, elem, selfClosing);
  return tagEnd + 1;
}

function pushElement(state: ParserState, elem: HTMLElement, selfClosing: boolean): void {
  const { doc, stack } = state;
  if (stack.length > 0) {
    const parent = stack[stack.length - 1];
    elem.parent = parent;
    parent.children.push(elem);
  }
  doc.elements.push(elem);
  if (!selfClosing) stack.push(elem);
}

function dispatchToken(state: ParserState, tagStart: number): number {
  const { src } = state;
  if (src.startsWith('<!--', tagStart)) return handleComment(src, tagStart);
  if (src.startsWith('<!', tagStart)) return handleDoctype(src, tagStart);
  if (src[tagStart + 1] === '/') return handleCloseTag(state, tagStart);
  return handleOpenTag(state, tagStart);
}

export function parseHTML(src: string): HTMLDocument {
  const state: ParserState = {
    src,
    idx: new LineIndex(src),
    doc: { elements: [], styleTags: [] },
    stack: [],
    pos: 0
  };

  while (state.pos < src.length) {
    const tagStart = src.indexOf('<', state.pos);
    if (tagStart < 0) break;

    captureStyleText(state, state.pos, tagStart);

    const next = dispatchToken(state, tagStart);
    if (next < 0) break;
    state.pos = next;
  }

  captureStyleText(state, state.pos, src.length);

  return state.doc;
}

const voidElements = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
]);

function isVoidElement(tagName: string): boolean {
  return voidElements.has(tagName);
}

function skipWhitespace(src: string, start: number): number {
  let idx = start;
  while (idx < src.length && isWhitespace(src[idx])) idx++;
  return idx;
}

function skipTagName(src: string, start: number): number {
  let idx = start;
  while (idx < src.length && !isTagDelimiter(src[idx])) idx++;
  return idx;
}

function readAttrName(src: string, start: number): number {
  let idx = start;
  while (idx < src.length && src[idx] !== '=' && !isTagDelimiter(src[idx])) idx++;
  return idx;
}

function readQuotedValue(src: string, start: number): { value: string; next: number } {
  const quote = src[start];
  let idx = start + 1;
  const valueStart = idx;
  while (idx < src.length && src[idx] !== quote) idx++;
  const value = src.slice(valueStart, idx);
  if (idx < src.length) idx++;
  return { value, next: idx };
}

function readUnquotedValue(src: string, start: number): { value: string; next: number } {
  let idx = start;
  while (idx < src.length && !isTagDelimiter(src[idx])) idx++;
  return { value: src.slice(start, idx), next: idx };
}

function readAttrValue(src: string, start: number): { value: string; next: number } {
  if (src[start] === '"' || src[start] === "'") return readQuotedValue(src, start);
  return readUnquotedValue(src, start);
}

function parseSingleAttribute(
  tagSrc: string,
  start: number,
  tagOffset: number,
  idx: LineIndex
): { attr: HTMLAttribute | null; next: number } {
  const nameStart = start;
  let cursor = readAttrName(tagSrc, start);
  if (nameStart === cursor) return { attr: null, next: cursor + 1 };

  const attrName = tagSrc.slice(nameStart, cursor);
  const { line, col } = idx.position(tagOffset + nameStart);
  const attr: HTMLAttribute = {
    name: attrName,
    value: '',
    line,
    column: col,
    hasValue: false
  };

  cursor = skipWhitespace(tagSrc, cursor);
  if (cursor >= tagSrc.length || tagSrc[cursor] !== '=') return { attr, next: cursor };

  attr.hasValue = true;
  cursor = skipWhitespace(tagSrc, cursor + 1);
  if (cursor < tagSrc.length) {
    const { value, next } = readAttrValue(tagSrc, cursor);
    attr.value = value;
    cursor = next;
  }
  return { attr, next: cursor };
}

function parseAttributes(src: string, tagOffset: number, idx: LineIndex): HTMLAttribute[] {
  const tagEnd = findTagEnd(src, tagOffset);
  if (tagEnd >= src.length) return [];
  const tagSrc = src.slice(tagOffset, tagEnd + 1);

  let cursor = skipTagName(tagSrc, 1); // skip '<' then tag name
  const attrs: HTMLAttribute[] = [];

  while (cursor < tagSrc.length) {
    cursor = skipWhitespace(tagSrc, cursor);
    if (cursor >= tagSrc.length || tagSrc[cursor] === '>' || tagSrc[cursor] === '/') break;

    const { attr, next } = parseSingleAttribute(tagSrc, cursor, tagOffset, idx);
    cursor = next;
    if (attr) attrs.push(attr);
  }

  return attrs;
}
