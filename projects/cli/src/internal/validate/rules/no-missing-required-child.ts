import type { Store } from '../../elements/store.js';
import type { PatternStore } from '../../patterns/store.js';
import type { ChildRule, ElementRef, Pattern } from '../../patterns/types.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument, type HTMLElement } from '../types.js';

export class NoMissingRequiredChild implements Rule {
  #patternStore?: PatternStore;

  readonly id = 'no-missing-required-child';

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
        if (!isRootMatch(pat, elem.tagName)) continue;
        collectPatternMessages(elem, pat, this.id, this.severity, msgs);
      }
    }

    return msgs;
  }
}

function isRootMatch(pat: Pattern, tagName: string): boolean {
  return !!pat.structure.root && pat.structure.root.tag === tagName;
}

function collectPatternMessages(
  elem: HTMLElement,
  pat: Pattern,
  ruleId: string,
  severity: Severity,
  msgs: LintMessage[]
): void {
  for (const child of pat.structure.children ?? []) {
    const msg = checkChildRule(elem, pat, child, ruleId, severity);
    if (msg) msgs.push(msg);
  }
}

function checkChildRule(
  elem: HTMLElement,
  pat: Pattern,
  child: ChildRule,
  ruleId: string,
  severity: Severity
): LintMessage | undefined {
  switch (child.rule) {
    case 'required':
      return checkRequiredChild(elem, pat, child, ruleId, severity);
    case 'oneOf':
      return checkOneOfChild(elem, pat, child, ruleId, severity);
    case 'oneOrMore':
      return checkOneOrMoreChild(elem, pat, child, ruleId, severity);
    default:
      return undefined;
  }
}

function checkRequiredChild(
  elem: HTMLElement,
  pat: Pattern,
  child: ChildRule,
  ruleId: string,
  severity: Severity
): LintMessage | undefined {
  if (!child.element) return undefined;
  if (hasMatchingChild(elem, child.element)) return undefined;
  return buildMessage(
    elem,
    ruleId,
    severity,
    `Pattern "${pat.name}": <${elem.tagName}> requires a ${describeChildElement(child.element)} child`
  );
}

function checkOneOfChild(
  elem: HTMLElement,
  pat: Pattern,
  child: ChildRule,
  ruleId: string,
  severity: Severity
): LintMessage | undefined {
  if (!child.options?.length) return undefined;
  if (child.options.some(opt => hasMatchingChild(elem, opt))) return undefined;
  const descs = child.options.map(opt => describeChildElement(opt));
  return buildMessage(
    elem,
    ruleId,
    severity,
    `Pattern "${pat.name}": <${elem.tagName}> requires one of: ${descs.join(', ')}`
  );
}

function checkOneOrMoreChild(
  elem: HTMLElement,
  pat: Pattern,
  child: ChildRule,
  ruleId: string,
  severity: Severity
): LintMessage | undefined {
  if (!child.element) return undefined;
  if (hasMatchingChild(elem, child.element)) return undefined;
  return buildMessage(
    elem,
    ruleId,
    severity,
    `Pattern "${pat.name}": <${elem.tagName}> requires at least one ${describeChildElement(child.element)} child`
  );
}

function buildMessage(elem: HTMLElement, ruleId: string, severity: Severity, message: string): LintMessage {
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
