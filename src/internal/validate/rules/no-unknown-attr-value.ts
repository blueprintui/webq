import type { Store } from '../../elements/store.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { isCustomElement, parseAttrValues } from '../schema.js';

export class NoUnknownAttrValue implements Rule {
  id() {
    return 'no-unknown-attr-value';
  }
  severity() {
    return Severity.Error;
  }

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];

    for (const elem of doc.elements) {
      if (!isCustomElement(elem.tagName)) continue;

      const decl = store.getElement(elem.tagName);
      if (!decl) continue;

      const attrDefs = new Map((decl.attributes ?? []).map(a => [a.name, a]));

      for (const attr of elem.attributes) {
        if (!attr.hasValue) continue;

        const def = attrDefs.get(attr.name);
        if (!def?.type) continue;

        const allowed = parseAttrValues(def.type.text);
        if (!allowed) continue;

        if (!allowed.includes(attr.value)) {
          msgs.push({
            ruleId: this.id(),
            severity: this.severity(),
            message: `Invalid value "${attr.value}" for attribute "${attr.name}" on <${elem.tagName}>. Valid values: ${allowed.join(', ')}`,
            line: attr.line,
            column: attr.column
          });
        }
      }
    }

    return msgs;
  }
}
