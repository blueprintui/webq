import type { Store } from '../../elements/store.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { isCustomElement, parseEventName } from '../schema.js';

export class NoDeprecatedEvent implements Rule {
  id() {
    return 'no-deprecated-event';
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

      const deprecatedEvents = new Map<string, string>();
      for (const e of decl.events ?? []) {
        if (e.deprecated) deprecatedEvents.set(e.name, e.deprecated);
      }

      for (const attr of elem.attributes) {
        const { name: eventName, isEvent } = parseEventName(attr.name);
        if (!isEvent) continue;

        const reason = deprecatedEvents.get(eventName);
        if (!reason) continue;

        msgs.push({
          ruleId: this.id(),
          severity: this.severity(),
          message: `Event "${eventName}" on <${elem.tagName}> is deprecated. ${reason}`,
          line: attr.line,
          column: attr.column
        });
      }
    }

    return msgs;
  }
}
