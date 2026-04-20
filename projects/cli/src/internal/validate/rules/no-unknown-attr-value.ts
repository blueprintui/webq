import type { Store } from '../../elements/store.js';
import type { Attribute } from '../../elements/types.js';
import type { HTMLAttribute, HTMLElement } from '../types.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { isCustomElement, parseAttrValues } from '../schema.js';

export class NoUnknownAttrValue implements Rule {
  readonly id: string;
  readonly severity: Severity;

  constructor() {
    this.id = 'no-unknown-attr-value';
    this.severity = Severity.Error;
  }

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];

    for (const elem of doc.elements) {
      const attrDefs = getAttrDefs(elem, store);
      if (!attrDefs) continue;

      for (const attr of elem.attributes) {
        const msg = checkAttrValue({ elem, attr, attrDefs }, this.id, this.severity);
        if (msg) msgs.push(msg);
      }
    }

    return msgs;
  }
}

interface AttrValueContext {
  elem: HTMLElement;
  attr: HTMLAttribute;
  attrDefs: Map<string, Attribute>;
}

function getAttrDefs(elem: HTMLElement, store: Store): Map<string, Attribute> | undefined {
  if (!isCustomElement(elem.tagName)) return undefined;
  const decl = store.getElement(elem.tagName);
  if (!decl) return undefined;
  return new Map((decl.attributes ?? []).map(attr => [attr.name, attr]));
}

function checkAttrValue(ctx: AttrValueContext, ruleId: string, severity: Severity): LintMessage | undefined {
  const { elem, attr, attrDefs } = ctx;
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
