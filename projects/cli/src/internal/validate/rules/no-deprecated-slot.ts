import type { Store } from '../../elements/store.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { isCustomElement } from '../schema.js';

export class NoDeprecatedSlot implements Rule {
  readonly id = 'no-deprecated-slot';

  readonly severity = Severity.Warning;

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];

    for (const elem of doc.elements) {
      for (const attr of elem.attributes) {
        if (attr.name !== 'slot') continue;

        const parent = elem.parent;
        if (!parent || !isCustomElement(parent.tagName)) continue;

        const decl = store.getElement(parent.tagName);
        if (!decl) continue;

        for (const s of decl.slots ?? []) {
          if (s.name === attr.value && s.deprecated) {
            msgs.push({
              ruleId: this.id,
              severity: this.severity,
              message: `Slot "${attr.value}" on <${parent.tagName}> is deprecated. ${s.deprecated}`,
              line: attr.line,
              column: attr.column
            });
            break;
          }
        }
      }
    }

    return msgs;
  }
}
