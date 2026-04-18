import type { Store } from '../../elements/store.js';
import type { Attribute } from '../../elements/types.js';
import type { HTMLAttribute, HTMLElement } from '../types.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { isCustomElement, parseAttrValues } from '../schema.js';

export class NoUnknownAttrValue implements Rule {
  readonly id = 'no-unknown-attr-value';

  readonly severity = Severity.Error;

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];

    for (const elem of doc.elements) {
      const attrDefs = getAttrDefs(elem, store);
      if (!attrDefs) continue;

      for (const attr of elem.attributes) {
        const msg = checkAttrValue(elem, attr, attrDefs, this.id, this.severity);
        if (msg) msgs.push(msg);
      }
    }

    return msgs;
  }
}

function getAttrDefs(elem: HTMLElement, store: Store): Map<string, Attribute> | undefined {
  if (!isCustomElement(elem.tagName)) return undefined;
  const decl = store.getElement(elem.tagName);
  if (!decl) return undefined;
  return new Map((decl.attributes ?? []).map(a => [a.name, a]));
}

function checkAttrValue(
  elem: HTMLElement,
  attr: HTMLAttribute,
  attrDefs: Map<string, Attribute>,
  ruleId: string,
  severity: Severity
): LintMessage | undefined {
  if (!attr.hasValue) return undefined;

  const def = attrDefs.get(attr.name);
  if (!def?.type) return undefined;

  const allowed = parseAttrValues(def.type.text);
  if (!allowed) return undefined;

  if (allowed.includes(attr.value)) return undefined;

  return {
    ruleId,
    severity,
    message: `Invalid value "${attr.value}" for attribute "${attr.name}" on <${elem.tagName}>. Valid values: ${allowed.join(', ')}`,
    line: attr.line,
    column: attr.column
  };
}
