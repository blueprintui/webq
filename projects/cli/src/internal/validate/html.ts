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
  let i = start;
  let inQuote = 0;
  while (i < src.length) {
    const ch = src.charCodeAt(i);
    if (inQuote) {
      if (ch === inQuote) inQuote = 0;
    } else if (ch === CHAR_DQUOTE || ch === CHAR_SQUOTE) {
      inQuote = ch;
    } else if (ch === CHAR_GT) {
      return i;
    }
    i++;
  }
  return i;
}

class LineIndex {
  #lineStarts: number[];

  constructor(src: string) {
    this.#lineStarts = [0];
    for (let i = 0; i < src.length; i++) {
      if (src[i] === '\n') {
        this.#lineStarts.push(i + 1);
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
  const { src, idx, doc, stack } = state;
  let i = tagStart + 1;
  if (i >= src.length || !/[a-zA-Z]/.test(src[i])) return tagStart + 1;

  const { line, col } = idx.position(tagStart);
  while (i < src.length && !isTagDelimiter(src[i])) i++;
  const tagName = src.slice(tagStart + 1, i).toLowerCase();

  const tagEnd = findTagEnd(src, i);
  if (tagEnd >= src.length) return -1;

  const selfClosing = src[tagEnd - 1] === '/' || isVoidElement(tagName);
  const attrs = parseAttributes(src, tagStart, idx);
  const elem: HTMLElement = { tagName, attributes: attrs, children: [], line, column: col };

  if (stack.length > 0) {
    const parent = stack[stack.length - 1];
    elem.parent = parent;
    parent.children.push(elem);
  }
  doc.elements.push(elem);
  if (!selfClosing) stack.push(elem);

  return tagEnd + 1;
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

function skipWhitespace(src: string, i: number): number {
  while (i < src.length && isWhitespace(src[i])) i++;
  return i;
}

function skipTagName(src: string, i: number): number {
  while (i < src.length && !isTagDelimiter(src[i])) i++;
  return i;
}

function readAttrName(src: string, i: number): number {
  while (i < src.length && src[i] !== '=' && !isTagDelimiter(src[i])) i++;
  return i;
}

function readQuotedValue(src: string, i: number): { value: string; next: number } {
  const quote = src[i];
  i++;
  const start = i;
  while (i < src.length && src[i] !== quote) i++;
  const value = src.slice(start, i);
  if (i < src.length) i++;
  return { value, next: i };
}

function readUnquotedValue(src: string, i: number): { value: string; next: number } {
  const start = i;
  while (i < src.length && !isTagDelimiter(src[i])) i++;
  return { value: src.slice(start, i), next: i };
}

function readAttrValue(src: string, i: number): { value: string; next: number } {
  if (src[i] === '"' || src[i] === "'") return readQuotedValue(src, i);
  return readUnquotedValue(src, i);
}

function parseSingleAttribute(
  tagSrc: string,
  i: number,
  tagOffset: number,
  idx: LineIndex
): { attr: HTMLAttribute | null; next: number } {
  const nameStart = i;
  i = readAttrName(tagSrc, i);
  if (nameStart === i) return { attr: null, next: i + 1 };

  const attrName = tagSrc.slice(nameStart, i);
  const { line, col } = idx.position(tagOffset + nameStart);
  const attr: HTMLAttribute = {
    name: attrName,
    value: '',
    line,
    column: col,
    hasValue: false
  };

  i = skipWhitespace(tagSrc, i);
  if (i >= tagSrc.length || tagSrc[i] !== '=') return { attr, next: i };

  attr.hasValue = true;
  i = skipWhitespace(tagSrc, i + 1);
  if (i < tagSrc.length) {
    const { value, next } = readAttrValue(tagSrc, i);
    attr.value = value;
    i = next;
  }
  return { attr, next: i };
}

function parseAttributes(src: string, tagOffset: number, idx: LineIndex): HTMLAttribute[] {
  const tagEnd = findTagEnd(src, tagOffset);
  if (tagEnd >= src.length) return [];
  const tagSrc = src.slice(tagOffset, tagEnd + 1);

  let i = skipTagName(tagSrc, 1); // skip '<' then tag name
  const attrs: HTMLAttribute[] = [];

  while (i < tagSrc.length) {
    i = skipWhitespace(tagSrc, i);
    if (i >= tagSrc.length || tagSrc[i] === '>' || tagSrc[i] === '/') break;

    const { attr, next } = parseSingleAttribute(tagSrc, i, tagOffset, idx);
    i = next;
    if (attr) attrs.push(attr);
  }

  return attrs;
}
