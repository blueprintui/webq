import type { Store } from '../../elements/store.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { isCustomElement } from '../schema.js';

export class NoDeprecatedElement implements Rule {
  readonly id = 'no-deprecated-element';

  readonly severity = Severity.Warning;

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];

    for (const elem of doc.elements) {
      if (!isCustomElement(elem.tagName)) continue;

      const decl = store.getElement(elem.tagName);
      if (!decl?.deprecated) continue;

      msgs.push({
        ruleId: this.id,
        severity: this.severity,
        message: `<${elem.tagName}> is deprecated. ${decl.deprecated}`,
        line: elem.line,
        column: elem.column,
        endLine: elem.endLine,
        endColumn: elem.endColumn
      });
    }

    return msgs;
  }
}
