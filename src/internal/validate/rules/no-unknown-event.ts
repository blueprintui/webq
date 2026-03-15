import type { Store } from '../../elements/store.js';
import type { Event } from '../../elements/types.js';
import { Severity, type Rule, type LintMessage, type RuleOptionSet, type HTMLDocument } from '../types.js';
import { isCustomElement, parseEventName } from '../schema.js';
import { formatSuggestion } from './suggestion.js';

export class NoUnknownEvent implements Rule {
  #allowedEvents = new Set<string>();

  id() {
    return 'no-unknown-event';
  }
  severity() {
    return Severity.Error;
  }

  configure(opts: RuleOptionSet): void {
    this.#allowedEvents = new Set(opts.events ?? []);
  }

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];

    for (const elem of doc.elements) {
      if (!isCustomElement(elem.tagName)) continue;

      const decl = store.getElement(elem.tagName);
      if (!decl) continue;

      const eventSet = new Set((decl.events ?? []).map(e => e.name));

      for (const attr of elem.attributes) {
        const { name: eventName, isEvent } = parseEventName(attr.name);
        if (!isEvent) continue;
        if (this.#allowedEvents.has(eventName)) continue;

        if (!eventSet.has(eventName)) {
          const suggestion = formatEventNames(decl.events ?? []);
          msgs.push({
            ruleId: this.id(),
            severity: this.severity(),
            message: `Unknown event "${eventName}" on <${elem.tagName}>. ${suggestion}`,
            line: attr.line,
            column: attr.column
          });
        }
      }
    }

    return msgs;
  }
}

function formatEventNames(events: Event[]): string {
  return formatSuggestion(
    events.map(e => e.name),
    'events',
    'Valid events'
  );
}
