import type { Store } from '../../elements/store.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { isCustomElement } from '../schema.js';

export class NoDeprecatedAttr implements Rule {
  readonly id: string;

  readonly severity: Severity;

  constructor() {
    this.id = 'no-deprecated-attr';
    this.severity = Severity.Warning;
  }

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];

    for (const elem of doc.elements) {
      if (!isCustomElement(elem.tagName)) continue;

      const decl = store.getElement(elem.tagName);
      if (!decl) continue;

      const deprecatedAttrs = new Map<string, string>();
      for (const attr of decl.attributes ?? []) {
        if (attr.deprecated) deprecatedAttrs.set(attr.name, attr.deprecated);
      }

      for (const attr of elem.attributes) {
        const reason = deprecatedAttrs.get(attr.name);
        if (!reason) continue;

        msgs.push({
          ruleId: this.id,
          severity: this.severity,
          message: `Attribute "${attr.name}" on <${elem.tagName}> is deprecated. ${reason}`,
          line: attr.line,
          column: attr.column
        });
      }
    }

    return msgs;
  }
}
