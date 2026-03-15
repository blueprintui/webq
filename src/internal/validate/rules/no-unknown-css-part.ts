import type { Store } from '../../elements/store.js';
import type { CSSPart } from '../../elements/types.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument, type HTMLStyleTag } from '../types.js';
import { isCustomElement } from '../schema.js';
import { formatSuggestion } from './suggestion.js';

export class NoUnknownCSSPart implements Rule {
  id() {
    return 'no-unknown-css-part';
  }
  severity() {
    return Severity.Error;
  }

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];

    for (const style of doc.styleTags) {
      for (const match of style.content.matchAll(/([\w-]+)::part\(([^)]+)\)/g)) {
        const tagName = match[1];
        const partName = match[2];

        if (!isCustomElement(tagName)) continue;

        const decl = store.getElement(tagName);
        if (!decl) continue;

        const partSet = new Set((decl.cssParts ?? []).map(p => p.name));

        if (!partSet.has(partName)) {
          const { line, col } = computeStylePosition(style, match.index);
          const suggestion = formatCSSPartNames(decl.cssParts ?? []);
          msgs.push({
            ruleId: this.id(),
            severity: this.severity(),
            message: `Unknown CSS part "${partName}" on <${tagName}>. ${suggestion}`,
            line,
            column: col
          });
        }
      }
    }

    return msgs;
  }
}

function formatCSSPartNames(parts: CSSPart[]): string {
  return formatSuggestion(
    parts.map(p => p.name),
    'CSS parts',
    'Valid parts'
  );
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
