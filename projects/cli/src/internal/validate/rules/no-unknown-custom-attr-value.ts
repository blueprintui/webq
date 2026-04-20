import type { Store } from '../../elements/store.js';
import type { CustomAttributeStore } from '../../attributes/store.js';
import type { CustomAttribute } from '../../attributes/types.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument, type HTMLAttribute } from '../types.js';
import { customAttrAppliesTo } from './no-unknown-attr.js';

export class NoUnknownCustomAttrValue implements Rule {
  #customAttrStore?: CustomAttributeStore;
  readonly id: string;
  readonly severity: Severity;

  constructor() {
    this.id = 'no-unknown-custom-attr-value';
    this.severity = Severity.Warning;
  }

  setCustomAttributeStore(store: CustomAttributeStore | undefined): void {
    this.#customAttrStore = store;
  }

  check(doc: HTMLDocument, _store: Store): LintMessage[] {
    if (!this.#customAttrStore) return [];
    const customAttrStore = this.#customAttrStore;

    const msgs: LintMessage[] = [];

    for (const elem of doc.elements) {
      for (const attr of elem.attributes) {
        const ca = customAttrStore.getCustomAttribute(attr.name);
        if (!ca) continue;
        if (!customAttrAppliesTo(ca, elem.tagName)) continue;

        switch (ca.syntax) {
          case 'token-list':
            msgs.push(...this.#checkTokenList(ca, attr, elem.tagName));
            break;
          case 'enum':
            msgs.push(...this.#checkEnum(ca, attr, elem.tagName));
            break;
        }
      }
    }

    return msgs;
  }

  #checkTokenList(ca: CustomAttribute, attr: HTMLAttribute, tagName: string): LintMessage[] {
    if (!attr.hasValue || !attr.value) return [];

    const validTokens = buildTokenSet(ca);
    const msgs: LintMessage[] = [];

    for (const token of attr.value.split(/\s+/)) {
      if (!validTokens.has(token)) {
        msgs.push({
          ruleId: this.id,
          severity: this.severity,
          message: `Unknown token "${token}" for custom attribute "${ca.name}" on <${tagName}>.`,
          line: attr.line,
          column: attr.column
        });
      }
    }

    return msgs;
  }

  #checkEnum(ca: CustomAttribute, attr: HTMLAttribute, tagName: string): LintMessage[] {
    if (!attr.hasValue || !attr.value) return [];

    for (const value of ca.values ?? []) {
      if (value.value === attr.value) return [];
    }

    const validValues = (ca.values ?? []).map(value => value.value);

    return [
      {
        ruleId: this.id,
        severity: this.severity,
        message: `Unknown value "${attr.value}" for custom attribute "${ca.name}" on <${tagName}>. Valid values: ${validValues.join(', ')}`,
        line: attr.line,
        column: attr.column
      }
    ];
  }
}

function buildTokenSet(ca: CustomAttribute): Set<string> {
  const set = new Set<string>();
  for (const group of ca.tokenGroups ?? []) {
    for (const value of group.values ?? []) {
      set.add(value.value);
    }
  }
  for (const value of ca.values ?? []) {
    set.add(value.value);
  }
  return set;
}
