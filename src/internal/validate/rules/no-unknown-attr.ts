import type { Store } from '../../elements/store.js';
import type { CustomAttributeStore } from '../../attributes/store.js';
import type { CustomAttribute } from '../../attributes/types.js';
import type { Attribute } from '../../elements/types.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { isCustomElement, isGlobalAttr, parseEventName } from '../schema.js';
import { formatSuggestion } from './suggestion.js';

export class NoUnknownAttr implements Rule {
  #customAttrStore?: CustomAttributeStore;

  id() {
    return 'no-unknown-attr';
  }
  severity() {
    return Severity.Error;
  }

  setCustomAttributeStore(store: CustomAttributeStore | undefined): void {
    this.#customAttrStore = store;
  }

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];

    for (const elem of doc.elements) {
      if (!isCustomElement(elem.tagName)) continue;

      const decl = store.getElement(elem.tagName);
      if (!decl) continue;

      const attrSet = new Set((decl.attributes ?? []).map(a => a.name));

      for (const attr of elem.attributes) {
        if (isGlobalAttr(attr.name)) continue;
        if (parseEventName(attr.name).isEvent) continue;
        if (attr.name === 'command' || attr.name === 'commandfor') continue;

        if (!attrSet.has(attr.name)) {
          if (this.#isCustomAttr(attr.name, elem.tagName)) continue;

          const suggestion = formatAttrNames(decl.attributes ?? []);
          msgs.push({
            ruleId: this.id(),
            severity: this.severity(),
            message: `Unknown attribute "${attr.name}" on <${elem.tagName}>. ${suggestion}`,
            line: attr.line,
            column: attr.column
          });
        }
      }
    }

    return msgs;
  }

  #isCustomAttr(attrName: string, tagName: string): boolean {
    if (!this.#customAttrStore) return false;
    const ca = this.#customAttrStore.getCustomAttribute(attrName);
    if (!ca) return false;
    return customAttrAppliesTo(ca, tagName);
  }
}

export function customAttrAppliesTo(ca: CustomAttribute, tagName: string): boolean {
  if (!ca.appliesTo) return false;
  if (ca.appliesTo.all) return true;
  return ca.appliesTo.elements.includes(tagName);
}

function formatAttrNames(attrs: Attribute[]): string {
  return formatSuggestion(
    attrs.map(a => a.name),
    'attributes',
    'Valid attributes'
  );
}
