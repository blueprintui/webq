import type { HTMLStyleTag } from '../types.js';

export const cssRuleBlockRegex = /([\w-]+(?:::[\w-]+(?:\([^)]*\))?)?)\s*\{([^}]*)\}/g;
export const cssCustomPropRegex = /(--[\w-]+)\s*:/g;
export const cssVarRefRegex = /var\(\s*(--[\w-]+)/g;
const tagNameSplitRegex = /[:.#[\s]/;

export function extractTagName(selector: string): string {
  const parts = selector.split(tagNameSplitRegex);
  return parts[0] || selector;
}

export function computeStylePosition(style: HTMLStyleTag, offset: number): { line: number; col: number } {
  const content = style.content.slice(0, offset);
  const newlines = (content.match(/\n/g) || []).length;
  const line = style.contentLine + newlines;
  const lastNewline = content.lastIndexOf('\n');
  if (lastNewline < 0) {
    return { line, col: style.contentColumn + offset };
  }
  return { line, col: offset - lastNewline };
}
