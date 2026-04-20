import type { Store } from '../../elements/store.js';
import type { Slot } from '../../elements/types.js';
import type { HTMLAttribute, HTMLElement } from '../types.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { isCustomElement } from '../schema.js';

export class NoDeprecatedSlot implements Rule {
  readonly id: string;
  readonly severity: Severity;

  constructor() {
    this.id = 'no-deprecated-slot';
    this.severity = Severity.Warning;
  }

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];

    for (const elem of doc.elements) {
      for (const attr of elem.attributes) {
        const msg = checkSlotAttr({ elem, attr, store }, this.id, this.severity);
        if (msg) msgs.push(msg);
      }
    }

    return msgs;
  }
}

interface SlotAttrContext {
  elem: HTMLElement;
  attr: HTMLAttribute;
  store: Store;
}

function checkSlotAttr(ctx: SlotAttrContext, ruleId: string, severity: Severity): LintMessage | undefined {
  const { elem, attr, store } = ctx;
  if (attr.name !== 'slot') return undefined;

  const parent = elem.parent;
  if (!parent || !isCustomElement(parent.tagName)) return undefined;

  const decl = store.getElement(parent.tagName);
  if (!decl) return undefined;

  const deprecatedSlot = findDeprecatedSlot(decl.slots ?? [], attr.value);
  if (!deprecatedSlot) return undefined;

  return {
    ruleId,
    severity,
    message: `Slot "${attr.value}" on <${parent.tagName}> is deprecated. ${deprecatedSlot.deprecated}`,
    line: attr.line,
    column: attr.column
  };
}

function findDeprecatedSlot(slots: Slot[], name: string): Slot | undefined {
  for (const slot of slots) {
    if (slot.name === name && slot.deprecated) return slot;
  }
  return undefined;
}
