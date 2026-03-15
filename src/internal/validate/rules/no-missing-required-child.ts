import type { Store } from '../../elements/store.js';
import type { PatternStore } from '../../patterns/store.js';
import type { ElementRef } from '../../patterns/types.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument, type HTMLElement } from '../types.js';

export class NoMissingRequiredChild implements Rule {
  #patternStore?: PatternStore;

  id() {
    return 'no-missing-required-child';
  }
  severity() {
    return Severity.Error;
  }

  setPatternStore(store: PatternStore | undefined): void {
    this.#patternStore = store;
  }

  check(doc: HTMLDocument, _store: Store): LintMessage[] {
    if (!this.#patternStore) return [];
    const patternStore = this.#patternStore;

    const msgs: LintMessage[] = [];

    for (const elem of doc.elements) {
      const pats = patternStore.getPatternsForElement(elem.tagName);
      for (const pat of pats) {
        if (!pat.structure.root || pat.structure.root.tag !== elem.tagName) continue;

        for (const child of pat.structure.children ?? []) {
          switch (child.rule) {
            case 'required':
              if (!child.element) continue;
              if (!hasMatchingChild(elem, child.element)) {
                msgs.push({
                  ruleId: this.id(),
                  severity: this.severity(),
                  message: `Pattern "${pat.name}": <${elem.tagName}> requires a ${describeChildElement(child.element)} child`,
                  line: elem.line,
                  column: elem.column
                });
              }
              break;
            case 'oneOf':
              if (!child.options?.length) continue;
              if (!child.options.some(opt => hasMatchingChild(elem, opt))) {
                const descs = child.options.map(opt => describeChildElement(opt));
                msgs.push({
                  ruleId: this.id(),
                  severity: this.severity(),
                  message: `Pattern "${pat.name}": <${elem.tagName}> requires one of: ${descs.join(', ')}`,
                  line: elem.line,
                  column: elem.column
                });
              }
              break;
            case 'oneOrMore':
              if (!child.element) continue;
              if (!hasMatchingChild(elem, child.element)) {
                msgs.push({
                  ruleId: this.id(),
                  severity: this.severity(),
                  message: `Pattern "${pat.name}": <${elem.tagName}> requires at least one ${describeChildElement(child.element)} child`,
                  line: elem.line,
                  column: elem.column
                });
              }
              break;
          }
        }
      }
    }

    return msgs;
  }
}

function hasMatchingChild(elem: HTMLElement, ref: ElementRef): boolean {
  for (const child of elem.children) {
    if (ref.tag !== '*' && child.tagName !== ref.tag) continue;
    if (ref.slot) {
      if (!childHasSlotAttr(child, ref.slot)) continue;
    }
    return true;
  }
  return false;
}

function childHasSlotAttr(elem: HTMLElement, slot: string): boolean {
  for (const attr of elem.attributes) {
    if (attr.name === 'slot' && attr.value === slot) return true;
  }
  return false;
}

function describeChildElement(ref: ElementRef): string {
  let desc = `<${ref.tag}>`;
  if (ref.slot) {
    desc = `<${ref.tag} slot="${ref.slot}">`;
  }
  return desc;
}
