import type { Store } from '../../elements/store.js';
import type { CustomAttributeStore } from '../../attributes/store.js';
import type { CustomAttribute } from '../../attributes/types.js';
import type { Attribute, Declaration } from '../../elements/types.js';
import type { HTMLAttribute, HTMLElement } from '../types.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { isCustomElement, isGlobalAttr, parseEventName } from '../schema.js';
import { formatSuggestion } from './suggestion.js';

export class NoUnknownAttr implements Rule {
  #customAttrStore?: CustomAttributeStore;
  readonly id: string;
  readonly severity: Severity;

  constructor() {
    this.id = 'no-unknown-attr';
    this.severity = Severity.Error;
  }

  setCustomAttributeStore(store: CustomAttributeStore | undefined): void {
    this.#customAttrStore = store;
  }

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];

    for (const elem of doc.elements) {
      const decl = getDeclaration(elem, store);
      if (!decl) continue;

      const attrSet = new Set((decl.attributes ?? []).map(attr => attr.name));

      for (const attr of elem.attributes) {
        const msg = this.#checkAttr(elem, attr, decl, attrSet);
        if (msg) msgs.push(msg);
      }
    }

    return msgs;
  }

  #checkAttr(elem: HTMLElement, attr: HTMLAttribute, decl: Declaration, attrSet: Set<string>): LintMessage | undefined {
    if (shouldSkipAttr(attr)) return undefined;
    if (attrSet.has(attr.name)) return undefined;
    if (this.#isCustomAttr(attr.name, elem.tagName)) return undefined;

    const suggestion = formatAttrNames(decl.attributes ?? []);
    return {
      ruleId: this.id,
      severity: this.severity,
      message: `Unknown attribute "${attr.name}" on <${elem.tagName}>. ${suggestion}`,
      line: attr.line,
      column: attr.column
    };
  }

  #isCustomAttr(attrName: string, tagName: string): boolean {
    if (!this.#customAttrStore) return false;
    const ca = this.#customAttrStore.getCustomAttribute(attrName);
    if (!ca) return false;
    return customAttrAppliesTo(ca, tagName);
  }
}

function getDeclaration(elem: HTMLElement, store: Store): Declaration | undefined {
  if (!isCustomElement(elem.tagName)) return undefined;
  return store.getElement(elem.tagName);
}

function shouldSkipAttr(attr: HTMLAttribute): boolean {
  if (isGlobalAttr(attr.name)) return true;
  if (parseEventName(attr.name).isEvent) return true;
  if (attr.name === 'command' || attr.name === 'commandfor') return true;
  return false;
}

export function customAttrAppliesTo(ca: CustomAttribute, tagName: string): boolean {
  if (!ca.appliesTo) return false;
  if (ca.appliesTo.all) return true;
  return ca.appliesTo.elements.includes(tagName);
}

function formatAttrNames(attrs: Attribute[]): string {
  return formatSuggestion(
    attrs.map(attr => attr.name),
    'attributes',
    'Valid attributes'
  );
}
