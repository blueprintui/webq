import type { Store } from '../../elements/store.js';
import type { PatternStore } from '../../patterns/store.js';
import type { AttributeBinding, AttributeRule, Pattern, SiblingRule } from '../../patterns/types.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument, type HTMLElement } from '../types.js';

export class NoMissingSiblingBinding implements Rule {
  #patternStore?: PatternStore;
  readonly id: string;
  readonly severity: Severity;

  constructor() {
    this.id = 'no-missing-sibling-binding';
    this.severity = Severity.Error;
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
        for (const sib of pat.structure.siblings ?? []) {
          collectSiblingMessages({ elem, doc, pat, sib, ruleId: this.id, severity: this.severity }, msgs);
        }
      }
    }

    return msgs;
  }
}

interface SiblingCheckContext {
  elem: HTMLElement;
  doc: HTMLDocument;
  pat: Pattern;
  sib: SiblingRule;
  ruleId: string;
  severity: Severity;
}

function collectSiblingMessages(ctx: SiblingCheckContext, msgs: LintMessage[]): void {
  const { elem, doc, sib } = ctx;
  if (sib.trigger.tag !== elem.tagName) return;
  if (!hasAnyTriggerAttr(elem, sib)) return;

  const triggerOk = validateTriggerAttrs(ctx, msgs);
  if (!triggerOk) return;

  const target = findTarget(elem, doc, sib);
  if (!target) {
    msgs.push(buildNoSiblingMessage(ctx));
    return;
  }

  validateTargetRequiredAttrs(ctx, target, msgs);
  validateBindings(ctx, target, msgs);
}

function hasAnyTriggerAttr(elem: HTMLElement, sib: SiblingRule): boolean {
  for (const attrRule of sib.trigger.attributes ?? []) {
    if (getAttrValue(elem, attrRule.name) !== undefined) return true;
  }
  return false;
}

function validateTriggerAttrs(ctx: SiblingCheckContext, msgs: LintMessage[]): boolean {
  const { sib } = ctx;
  let ok = true;
  for (const attrRule of sib.trigger.attributes ?? []) {
    if (!attrRule.required) continue;
    const msg = checkTriggerAttr(ctx, attrRule);
    if (msg) {
      ok = false;
      msgs.push(msg);
    }
  }
  return ok;
}

function checkTriggerAttr(ctx: SiblingCheckContext, attrRule: AttributeRule): LintMessage | undefined {
  const { elem, pat, ruleId, severity } = ctx;
  const val = getAttrValue(elem, attrRule.name);
  if (val === undefined) {
    return buildElemRangeMessage(
      elem,
      ruleId,
      severity,
      `Pattern "${pat.name}": <${elem.tagName}> is missing required attribute "${attrRule.name}"`
    );
  }
  if (attrRule.value && val !== attrRule.value) {
    return buildElemRangeMessage(
      elem,
      ruleId,
      severity,
      `Pattern "${pat.name}": <${elem.tagName}> attribute "${attrRule.name}" must be "${attrRule.value}"`
    );
  }
  return undefined;
}

function findTarget(elem: HTMLElement, doc: HTMLDocument, sib: SiblingRule): HTMLElement | undefined {
  const siblings = getSiblings(elem, doc);
  for (const sibling of siblings) {
    if (sibling.tagName === sib.target.tag) return sibling;
  }
  return undefined;
}

function buildNoSiblingMessage(ctx: SiblingCheckContext): LintMessage {
  const { elem, pat, sib, ruleId, severity } = ctx;
  const triggerDesc = describeElement(elem, sib);
  return buildElemRangeMessage(
    elem,
    ruleId,
    severity,
    `Pattern "${pat.name}": ${triggerDesc} has no sibling <${sib.target.tag}>`
  );
}

function validateTargetRequiredAttrs(ctx: SiblingCheckContext, target: HTMLElement, msgs: LintMessage[]): void {
  const { pat, sib, ruleId, severity } = ctx;
  for (const attrRule of sib.target.attributes ?? []) {
    if (!attrRule.required) continue;
    if (getAttrValue(target, attrRule.name) !== undefined) continue;
    msgs.push({
      ruleId,
      severity,
      message: `Pattern "${pat.name}": <${target.tagName}> is missing required attribute "${attrRule.name}"`,
      line: target.line,
      column: target.column
    });
  }
}

function validateBindings(ctx: SiblingCheckContext, target: HTMLElement, msgs: LintMessage[]): void {
  for (const binding of ctx.sib.bindings ?? []) {
    const msg = checkBinding(ctx, target, binding);
    if (msg) msgs.push(msg);
  }
}

function checkBinding(
  ctx: SiblingCheckContext,
  target: HTMLElement,
  binding: AttributeBinding
): LintMessage | undefined {
  const { elem, pat, sib, ruleId, severity } = ctx;
  const triggerVal = getAttrValue(elem, binding.triggerAttribute) ?? '';
  if (!triggerVal) return undefined;

  const targetVal = getAttrValue(target, binding.targetAttribute);
  if (targetVal === undefined) {
    return {
      ruleId,
      severity,
      message: `Pattern "${pat.name}": <${target.tagName}> is missing attribute "${binding.targetAttribute}" bound to <${elem.tagName} ${binding.triggerAttribute}="${triggerVal}">`,
      line: target.line,
      column: target.column
    };
  }
  if (targetVal !== '' && triggerVal !== targetVal) {
    return buildElemRangeMessage(
      elem,
      ruleId,
      severity,
      `Pattern "${pat.name}": <${elem.tagName} ${binding.triggerAttribute}="${triggerVal}"> has no sibling <${sib.target.tag} ${binding.targetAttribute}="${triggerVal}">`
    );
  }
  return undefined;
}

function buildElemRangeMessage(elem: HTMLElement, ruleId: string, severity: Severity, message: string): LintMessage {
  return {
    ruleId,
    severity,
    message,
    line: elem.line,
    column: elem.column,
    endLine: elem.endLine,
    endColumn: elem.endColumn
  };
}

function getAttrValue(elem: HTMLElement, name: string): string | undefined {
  for (const attr of elem.attributes) {
    if (attr.name === name) return attr.value;
  }
  return undefined;
}

function getSiblings(elem: HTMLElement, doc: HTMLDocument): HTMLElement[] {
  if (elem.parent) return elem.parent.children;
  return doc.elements.filter(event => !event.parent && event !== elem);
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
