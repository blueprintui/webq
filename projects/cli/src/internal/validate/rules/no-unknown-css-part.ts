import type { Store } from '../../elements/store.js';
import type { CSSPart } from '../../elements/types.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { isCustomElement } from '../schema.js';
import { formatSuggestion } from './suggestion.js';
import { computeStylePosition } from './css-helpers.js';

export class NoUnknownCSSPart implements Rule {
  readonly id = 'no-unknown-css-part';

  readonly severity = Severity.Error;

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
            ruleId: this.id,
            severity: this.severity,
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
