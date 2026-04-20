import type { Store } from '../../elements/store.js';
import { Severity, type Rule, type LintMessage, type RuleOptionSet, type HTMLDocument } from '../types.js';
import { isCustomElement } from '../schema.js';

export class NoUnknownElement implements Rule {
  #allowedTags: Set<string>;
  readonly id: string;
  readonly severity: Severity;

  constructor() {
    this.#allowedTags = new Set();
    this.id = 'no-unknown-element';
    this.severity = Severity.Error;
  }

  configure(opts: RuleOptionSet): void {
    this.#allowedTags = new Set(opts.tags ?? []);
  }

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];
    const seen = new Set<string>();

    for (const elem of doc.elements) {
      if (!isCustomElement(elem.tagName)) continue;
      if (seen.has(elem.tagName)) continue;
      if (this.#allowedTags.has(elem.tagName)) continue;

      if (!store.getElement(elem.tagName)) {
        seen.add(elem.tagName);
        msgs.push({
          ruleId: this.id,
          severity: this.severity,
          message: `Unknown custom element <${elem.tagName}>.`,
          line: elem.line,
          column: elem.column,
          endLine: elem.endLine,
          endColumn: elem.endColumn
        });
      }
    }

    return msgs;
  }
}
