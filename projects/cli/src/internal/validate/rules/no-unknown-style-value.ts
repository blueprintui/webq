import type { Store } from '../../elements/store.js';
import type { CustomStyleStore } from '../../styles/store.js';
import type { HTMLAttribute, HTMLElement, HTMLStyleTag } from '../types.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { isCustomElement } from '../schema.js';
import { computeStylePosition, cssRuleBlockRegex, cssVarRefRegex, extractTagName } from './css-helpers.js';

export class NoUnknownStyleValue implements Rule {
  #customStyleStore?: CustomStyleStore;

  readonly id = 'no-unknown-style-value';

  readonly severity = Severity.Warning;

  setCustomStyleStore(store: CustomStyleStore | undefined): void {
    this.#customStyleStore = store;
  }

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    if (!this.#customStyleStore) return [];
    const customStyleStore = this.#customStyleStore;

    const msgs: LintMessage[] = [];

    for (const style of doc.styleTags) {
      checkStyleTag(style, store, customStyleStore, this.id, this.severity, msgs);
    }

    for (const elem of doc.elements) {
      checkInlineStyle(elem, store, customStyleStore, this.id, this.severity, msgs);
    }

    return msgs;
  }
}

function checkStyleTag(
  style: HTMLStyleTag,
  store: Store,
  customStyleStore: CustomStyleStore,
  ruleId: string,
  severity: Severity,
  msgs: LintMessage[]
): void {
  for (const ruleMatch of style.content.matchAll(cssRuleBlockRegex)) {
    const selector = ruleMatch[1];
    const blockContent = ruleMatch[2];
    const blockStart = ruleMatch.index + ruleMatch[0].indexOf(blockContent);

    const tagName = extractTagName(selector);
    const elemPropSet = buildCSSPropSet(store, tagName);

    for (const varMatch of blockContent.matchAll(cssVarRefRegex)) {
      const tokenName = varMatch[1];
      if (isKnownToken(tokenName, customStyleStore, elemPropSet)) continue;

      const absOffset = blockStart + varMatch.index;
      const { line, col } = computeStylePosition(style, absOffset);
      msgs.push(buildUnknownTokenMessage(tokenName, ruleId, severity, line, col));
    }
  }
}

function checkInlineStyle(
  elem: HTMLElement,
  store: Store,
  customStyleStore: CustomStyleStore,
  ruleId: string,
  severity: Severity,
  msgs: LintMessage[]
): void {
  if (!isCustomElement(elem.tagName)) return;

  for (const attr of elem.attributes) {
    if (attr.name !== 'style' || !attr.hasValue) continue;
    checkInlineStyleAttr(elem, attr, store, customStyleStore, ruleId, severity, msgs);
  }
}

function checkInlineStyleAttr(
  elem: HTMLElement,
  attr: HTMLAttribute,
  store: Store,
  customStyleStore: CustomStyleStore,
  ruleId: string,
  severity: Severity,
  msgs: LintMessage[]
): void {
  const elemPropSet = buildCSSPropSet(store, elem.tagName);
  for (const varMatch of attr.value.matchAll(cssVarRefRegex)) {
    const tokenName = varMatch[1];
    if (isKnownToken(tokenName, customStyleStore, elemPropSet)) continue;
    msgs.push(buildUnknownTokenMessage(tokenName, ruleId, severity, attr.line, attr.column));
  }
}

function isKnownToken(
  tokenName: string,
  customStyleStore: CustomStyleStore,
  elemPropSet: Set<string> | undefined
): boolean {
  if (customStyleStore.getCSSCustomProperty(tokenName)) return true;
  if (elemPropSet?.has(tokenName)) return true;
  return false;
}

function buildUnknownTokenMessage(
  tokenName: string,
  ruleId: string,
  severity: Severity,
  line: number,
  column: number
): LintMessage {
  return {
    ruleId,
    severity,
    message: `Unknown CSS custom property value "${tokenName}" is not defined in custom styles or element CSS properties.`,
    line,
    column
  };
}

function buildCSSPropSet(store: Store, tagName: string): Set<string> | undefined {
  if (!isCustomElement(tagName)) return undefined;
  const decl = store.getElement(tagName);
  if (!decl) return undefined;
  return new Set((decl.cssProperties ?? []).map(p => p.name));
}
