import type { HTMLDocument, HTMLElement, HTMLAttribute } from './types.js';

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

export function parseHTML(src: string): HTMLDocument {
  const idx = new LineIndex(src);
  const doc: HTMLDocument = { elements: [], styleTags: [] };

  // Simple HTML tokenizer that tracks positions
  let pos = 0;
  const stack: HTMLElement[] = [];

  while (pos < src.length) {
    // Find next tag
    const tagStart = src.indexOf('<', pos);
    if (tagStart < 0) break;

    // Check for text content before this tag (for style content)
    if (stack.length > 0 && stack[stack.length - 1].tagName === 'style') {
      const textContent = src.slice(pos, tagStart);
      if (textContent.trim()) {
        const { line, col } = idx.position(pos);
        doc.styleTags.push({
          content: textContent,
          contentLine: line,
          contentColumn: col
        });
      }
    }

    // Check for comment
    if (src.startsWith('<!--', tagStart)) {
      const commentEnd = src.indexOf('-->', tagStart + 4);
      if (commentEnd >= 0) {
        pos = commentEnd + 3;
        continue;
      }
      break;
    }

    // Check for DOCTYPE
    if (src.startsWith('<!', tagStart) && !src.startsWith('<!--', tagStart)) {
      const docEnd = src.indexOf('>', tagStart);
      if (docEnd >= 0) {
        pos = docEnd + 1;
        continue;
      }
      break;
    }

    // Check for closing tag
    if (src[tagStart + 1] === '/') {
      const closeEnd = src.indexOf('>', tagStart);
      if (closeEnd >= 0) {
        if (stack.length > 0) {
          stack.pop();
        }
        pos = closeEnd + 1;
        continue;
      }
      break;
    }

    // Parse opening tag
    const { line, col } = idx.position(tagStart);

    // Extract tag name
    let i = tagStart + 1;
    if (i >= src.length || !/[a-zA-Z]/.test(src[i])) {
      pos = tagStart + 1;
      continue;
    }

    while (
      i < src.length &&
      src[i] !== ' ' &&
      src[i] !== '\t' &&
      src[i] !== '\n' &&
      src[i] !== '\r' &&
      src[i] !== '>' &&
      src[i] !== '/'
    ) {
      i++;
    }
    const tagName = src.slice(tagStart + 1, i).toLowerCase();

    // Find end of tag
    let tagEnd = i;
    let inQuote = 0;
    while (tagEnd < src.length) {
      const ch = src.charCodeAt(tagEnd);
      if (inQuote) {
        if (ch === inQuote) inQuote = 0;
      } else if (ch === 34 || ch === 39) {
        // " or '
        inQuote = ch;
      } else if (ch === 62) {
        // >
        break;
      }
      tagEnd++;
    }

    if (tagEnd >= src.length) break;

    const selfClosing = src[tagEnd - 1] === '/' || isVoidElement(tagName);

    // Parse attributes
    const attrs = parseAttributes(src, tagStart, idx);

    const elem: HTMLElement = {
      tagName,
      attributes: attrs,
      children: [],
      line,
      column: col
    };

    // Set parent relationship
    if (stack.length > 0) {
      const parent = stack[stack.length - 1];
      elem.parent = parent;
      parent.children.push(elem);
    }

    doc.elements.push(elem);

    if (!selfClosing) {
      stack.push(elem);
    }

    pos = tagEnd + 1;
  }

  // Handle any remaining style content
  if (stack.length > 0 && stack[stack.length - 1].tagName === 'style' && pos < src.length) {
    const textContent = src.slice(pos);
    if (textContent.trim()) {
      const { line, col } = idx.position(pos);
      doc.styleTags.push({
        content: textContent,
        contentLine: line,
        contentColumn: col
      });
    }
  }

  return doc;
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

function parseAttributes(src: string, tagOffset: number, idx: LineIndex): HTMLAttribute[] {
  // Find the end of this tag (the closing >)
  let tagEnd = tagOffset;
  let inQuote = 0;
  while (tagEnd < src.length) {
    const ch = src.charCodeAt(tagEnd);
    if (inQuote) {
      if (ch === inQuote) inQuote = 0;
    } else if (ch === 34 || ch === 39) {
      // " or '
      inQuote = ch;
    } else if (ch === 62) {
      // >
      break;
    }
    tagEnd++;
  }

  if (tagEnd >= src.length) return [];
  const tagSrc = src.slice(tagOffset, tagEnd + 1);

  // Skip past the tag name
  let i = 1; // skip '<'
  while (
    i < tagSrc.length &&
    tagSrc[i] !== ' ' &&
    tagSrc[i] !== '\t' &&
    tagSrc[i] !== '\n' &&
    tagSrc[i] !== '\r' &&
    tagSrc[i] !== '>' &&
    tagSrc[i] !== '/'
  ) {
    i++;
  }

  const attrs: HTMLAttribute[] = [];

  while (i < tagSrc.length) {
    // Skip whitespace
    while (i < tagSrc.length && (tagSrc[i] === ' ' || tagSrc[i] === '\t' || tagSrc[i] === '\n' || tagSrc[i] === '\r')) {
      i++;
    }

    if (i >= tagSrc.length || tagSrc[i] === '>' || tagSrc[i] === '/') break;

    // Read attribute name
    const nameStart = i;
    while (
      i < tagSrc.length &&
      tagSrc[i] !== '=' &&
      tagSrc[i] !== ' ' &&
      tagSrc[i] !== '\t' &&
      tagSrc[i] !== '\n' &&
      tagSrc[i] !== '\r' &&
      tagSrc[i] !== '>' &&
      tagSrc[i] !== '/'
    ) {
      i++;
    }

    if (nameStart === i) {
      i++;
      continue;
    }

    const attrName = tagSrc.slice(nameStart, i);
    const absNameOffset = tagOffset + nameStart;
    const { line, col } = idx.position(absNameOffset);

    const attr: HTMLAttribute = {
      name: attrName,
      value: '',
      line,
      column: col,
      hasValue: false
    };

    // Skip whitespace before potential =
    while (i < tagSrc.length && (tagSrc[i] === ' ' || tagSrc[i] === '\t' || tagSrc[i] === '\n' || tagSrc[i] === '\r')) {
      i++;
    }

    // Check for =value
    if (i < tagSrc.length && tagSrc[i] === '=') {
      attr.hasValue = true;
      i++; // skip '='

      // Skip whitespace after =
      while (
        i < tagSrc.length &&
        (tagSrc[i] === ' ' || tagSrc[i] === '\t' || tagSrc[i] === '\n' || tagSrc[i] === '\r')
      ) {
        i++;
      }

      if (i < tagSrc.length) {
        if (tagSrc[i] === '"' || tagSrc[i] === "'") {
          const quote = tagSrc[i];
          i++; // skip opening quote
          const valStart = i;
          while (i < tagSrc.length && tagSrc[i] !== quote) {
            i++;
          }
          attr.value = tagSrc.slice(valStart, i);
          if (i < tagSrc.length) {
            i++; // skip closing quote
          }
        } else {
          // Unquoted value
          const valStart = i;
          while (
            i < tagSrc.length &&
            tagSrc[i] !== ' ' &&
            tagSrc[i] !== '\t' &&
            tagSrc[i] !== '\n' &&
            tagSrc[i] !== '\r' &&
            tagSrc[i] !== '>' &&
            tagSrc[i] !== '/'
          ) {
            i++;
          }
          attr.value = tagSrc.slice(valStart, i);
        }
      }
    }

    attrs.push(attr);
  }

  return attrs;
}
