import type { Store } from '../../elements/store.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { isCustomElement } from '../schema.js';

export class NoBooleanAttrValue implements Rule {
  id() {
    return 'no-boolean-attr-value';
  }
  severity() {
    return Severity.Warning;
  }

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];

    for (const elem of doc.elements) {
      if (!isCustomElement(elem.tagName)) continue;

      const decl = store.getElement(elem.tagName);
      if (!decl) continue;

      const boolAttrs = new Set<string>();
      for (const a of decl.attributes ?? []) {
        if (a.type?.text === 'boolean') boolAttrs.add(a.name);
      }

      for (const attr of elem.attributes) {
        if (!attr.hasValue) continue;
        if (!boolAttrs.has(attr.name)) continue;

        msgs.push({
          ruleId: this.id(),
          severity: this.severity(),
          message: `Attribute "${attr.name}" on <${elem.tagName}> is boolean. Use "${attr.name}" alone instead of "${attr.name}"="${attr.value}".`,
          line: attr.line,
          column: attr.column
        });
      }
    }

    return msgs;
  }
}
