import type { Store } from '../../elements/store.js';
import type { PatternStore } from '../../patterns/store.js';
import type { SiblingRule } from '../../patterns/types.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument, type HTMLElement } from '../types.js';

export class NoMissingSiblingBinding implements Rule {
  #patternStore?: PatternStore;

  readonly id = 'no-missing-sibling-binding';

  readonly severity = Severity.Error;

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
        for (const sib of pat.structure.siblings ?? []) {
          if (sib.trigger.tag !== elem.tagName) continue;

          let hasAnyTriggerAttr = false;
          for (const attrRule of sib.trigger.attributes ?? []) {
            if (getAttrValue(elem, attrRule.name) !== undefined) {
              hasAnyTriggerAttr = true;
              break;
            }
          }
          if (!hasAnyTriggerAttr) continue;

          let triggerOk = true;
          for (const attrRule of sib.trigger.attributes ?? []) {
            if (!attrRule.required) continue;
            const val = getAttrValue(elem, attrRule.name);
            if (val === undefined) {
              triggerOk = false;
              msgs.push({
                ruleId: this.id,
                severity: this.severity,
                message: `Pattern "${pat.name}": <${elem.tagName}> is missing required attribute "${attrRule.name}"`,
                line: elem.line,
                column: elem.column
              });
            } else if (attrRule.value && val !== attrRule.value) {
              triggerOk = false;
              msgs.push({
                ruleId: this.id,
                severity: this.severity,
                message: `Pattern "${pat.name}": <${elem.tagName}> attribute "${attrRule.name}" must be "${attrRule.value}"`,
                line: elem.line,
                column: elem.column
              });
            }
          }

          if (!triggerOk) continue;

          const siblings = getSiblings(elem, doc);

          let target: HTMLElement | undefined;
          for (const sibling of siblings) {
            if (sibling.tagName === sib.target.tag) {
              target = sibling;
              break;
            }
          }

          if (!target) {
            const triggerDesc = describeElement(elem, sib);
            msgs.push({
              ruleId: this.id,
              severity: this.severity,
              message: `Pattern "${pat.name}": ${triggerDesc} has no sibling <${sib.target.tag}>`,
              line: elem.line,
              column: elem.column
            });
            continue;
          }

          for (const attrRule of sib.target.attributes ?? []) {
            if (!attrRule.required) continue;
            if (getAttrValue(target, attrRule.name) === undefined) {
              msgs.push({
                ruleId: this.id,
                severity: this.severity,
                message: `Pattern "${pat.name}": <${target.tagName}> is missing required attribute "${attrRule.name}"`,
                line: target.line,
                column: target.column
              });
            }
          }

          for (const binding of sib.bindings ?? []) {
            const triggerVal = getAttrValue(elem, binding.triggerAttribute) ?? '';
            const targetVal = getAttrValue(target, binding.targetAttribute);
            if (triggerVal && targetVal === undefined) {
              msgs.push({
                ruleId: this.id,
                severity: this.severity,
                message: `Pattern "${pat.name}": <${target.tagName}> is missing attribute "${binding.targetAttribute}" bound to <${elem.tagName} ${binding.triggerAttribute}="${triggerVal}">`,
                line: target.line,
                column: target.column
              });
            } else if (triggerVal && targetVal !== undefined && targetVal !== '' && triggerVal !== targetVal) {
              msgs.push({
                ruleId: this.id,
                severity: this.severity,
                message: `Pattern "${pat.name}": <${elem.tagName} ${binding.triggerAttribute}="${triggerVal}"> has no sibling <${sib.target.tag} ${binding.targetAttribute}="${triggerVal}">`,
                line: elem.line,
                column: elem.column
              });
            }
          }
        }
      }
    }

    return msgs;
  }
}

function getAttrValue(elem: HTMLElement, name: string): string | undefined {
  for (const attr of elem.attributes) {
    if (attr.name === name) return attr.value;
  }
  return undefined;
}

function getSiblings(elem: HTMLElement, doc: HTMLDocument): HTMLElement[] {
  if (elem.parent) return elem.parent.children;
  return doc.elements.filter(e => !e.parent && e !== elem);
}

function describeElement(elem: HTMLElement, sib: SiblingRule): string {
  let desc = `<${elem.tagName}`;
  for (const attrRule of sib.trigger.attributes ?? []) {
    const val = getAttrValue(elem, attrRule.name);
    if (val !== undefined) {
      desc += ` ${attrRule.name}="${val}"`;
    }
  }
  desc += '>';
  return desc;
}
