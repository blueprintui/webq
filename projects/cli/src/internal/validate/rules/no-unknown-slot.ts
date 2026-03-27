import type { Store } from '../../elements/store.js';
import type { Slot } from '../../elements/types.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { isCustomElement } from '../schema.js';
import { formatSuggestion } from './suggestion.js';

export class NoUnknownSlot implements Rule {
  readonly id = 'no-unknown-slot';

  readonly severity = Severity.Error;

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];

    for (const elem of doc.elements) {
      for (const attr of elem.attributes) {
        if (attr.name !== 'slot') continue;

        const parent = elem.parent;
        if (!parent || !isCustomElement(parent.tagName)) continue;

        const decl = store.getElement(parent.tagName);
        if (!decl) continue;

        const slotSet = new Set((decl.slots ?? []).map(s => s.name));

        if (!slotSet.has(attr.value)) {
          const suggestion = formatSlotNames(decl.slots ?? []);
          msgs.push({
            ruleId: this.id,
            severity: this.severity,
            message: `Unknown slot "${attr.value}" on <${parent.tagName}>. ${suggestion}`,
            line: attr.line,
            column: attr.column
          });
        }
      }
    }

    return msgs;
  }
}

function formatSlotNames(slots: Slot[]): string {
  const names = slots.map(s => (s.name === '' ? '"" (default)' : s.name));
  return formatSuggestion(names, 'slots', 'Available slots');
}
