import type { Store } from '../../elements/store.js';
import type { Attribute } from '../../elements/types.js';
import type { HTMLAttribute, HTMLElement } from '../types.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { isCustomElement } from '../schema.js';

export class NoBooleanAttrValue implements Rule {
  readonly id: string;
  readonly severity: Severity;

  constructor() {
    this.id = 'no-boolean-attr-value';
    this.severity = Severity.Warning;
  }

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];

    for (const elem of doc.elements) {
      const boolAttrs = getBooleanAttrs(elem, store);
      if (!boolAttrs) continue;

      for (const attr of elem.attributes) {
        if (!isBooleanAttrWithValue(attr, boolAttrs)) continue;
        msgs.push(buildMessage(this.id, this.severity, elem, attr));
      }
    }

    return msgs;
  }
}

function getBooleanAttrs(elem: HTMLElement, store: Store): Set<string> | undefined {
  if (!isCustomElement(elem.tagName)) return undefined;
  const decl = store.getElement(elem.tagName);
  if (!decl) return undefined;
  return collectBooleanAttrs(decl.attributes ?? []);
}

function collectBooleanAttrs(attrs: Attribute[]): Set<string> {
  const result = new Set<string>();
  for (const attr of attrs) {
    if (attr.type?.text === 'boolean') result.add(attr.name);
  }
  return result;
}

function isBooleanAttrWithValue(attr: HTMLAttribute, boolAttrs: Set<string>): boolean {
  if (!attr.hasValue) return false;
  return boolAttrs.has(attr.name);
}

function buildMessage(ruleId: string, severity: Severity, elem: HTMLElement, attr: HTMLAttribute): LintMessage {
  return {
    ruleId,
    severity,
    message: `Attribute "${attr.name}" on <${elem.tagName}> is boolean. Use "${attr.name}" alone instead of "${attr.name}"="${attr.value}".`,
    line: attr.line,
    column: attr.column
  };
}
