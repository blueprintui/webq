import type { Store } from '../../elements/store.js';
import type { PatternStore } from '../../patterns/store.js';
import type { ChildRule, ElementRef, Pattern } from '../../patterns/types.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument, type HTMLElement } from '../types.js';

export class NoMissingRequiredChild implements Rule {
  #patternStore?: PatternStore;
  readonly id: string;
  readonly severity: Severity;

  constructor() {
    this.id = 'no-missing-required-child';
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
        if (!isRootMatch(pat, elem.tagName)) continue;
        collectPatternMessages({ elem, pat, ruleId: this.id, severity: this.severity }, msgs);
      }
    }

    return msgs;
  }
}

interface ChildCheckContext {
  elem: HTMLElement;
  pat: Pattern;
  ruleId: string;
  severity: Severity;
}

function isRootMatch(pat: Pattern, tagName: string): boolean {
  const root = pat.structure.root;
  return root !== undefined && root.tag === tagName;
}

function collectPatternMessages(ctx: ChildCheckContext, msgs: LintMessage[]): void {
  for (const child of ctx.pat.structure.children ?? []) {
    const msg = checkChildRule(ctx, child);
    if (msg) msgs.push(msg);
  }
}

function checkChildRule(ctx: ChildCheckContext, child: ChildRule): LintMessage | undefined {
  switch (child.rule) {
    case 'required':
      return checkRequiredChild(ctx, child);
    case 'oneOf':
      return checkOneOfChild(ctx, child);
    case 'oneOrMore':
      return checkOneOrMoreChild(ctx, child);
    default:
      return undefined;
  }
}

function checkRequiredChild(ctx: ChildCheckContext, child: ChildRule): LintMessage | undefined {
  const { elem, pat } = ctx;
  if (!child.element) return undefined;
  if (hasMatchingChild(elem, child.element)) return undefined;
  return buildMessage(
    ctx,
    `Pattern "${pat.name}": <${elem.tagName}> requires a ${describeChildElement(child.element)} child`
  );
}

function checkOneOfChild(ctx: ChildCheckContext, child: ChildRule): LintMessage | undefined {
  const { elem, pat } = ctx;
  if (!child.options?.length) return undefined;
  if (child.options.some(opt => hasMatchingChild(elem, opt))) return undefined;
  const descs = child.options.map(opt => describeChildElement(opt));
  return buildMessage(ctx, `Pattern "${pat.name}": <${elem.tagName}> requires one of: ${descs.join(', ')}`);
}

function checkOneOrMoreChild(ctx: ChildCheckContext, child: ChildRule): LintMessage | undefined {
  const { elem, pat } = ctx;
  if (!child.element) return undefined;
  if (hasMatchingChild(elem, child.element)) return undefined;
  return buildMessage(
    ctx,
    `Pattern "${pat.name}": <${elem.tagName}> requires at least one ${describeChildElement(child.element)} child`
  );
}

function buildMessage(ctx: ChildCheckContext, message: string): LintMessage {
  const { elem, ruleId, severity } = ctx;
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
