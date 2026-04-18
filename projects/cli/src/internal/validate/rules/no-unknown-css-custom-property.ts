import type { Store } from '../../elements/store.js';
import type { CSSProperty, Declaration } from '../../elements/types.js';
import type { HTMLElement, HTMLStyleTag } from '../types.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { isCustomElement } from '../schema.js';
import { formatSuggestion } from './suggestion.js';
import { computeStylePosition, cssRuleBlockRegex, cssCustomPropRegex, extractTagName } from './css-helpers.js';

export class NoUnknownCSSCustomProperty implements Rule {
  readonly id = 'no-unknown-css-custom-property';

  readonly severity = Severity.Error;

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];

    for (const style of doc.styleTags) {
      checkStyleTag(style, store, this.id, this.severity, msgs);
    }

    for (const elem of doc.elements) {
      checkInlineStyle(elem, store, this.id, this.severity, msgs);
    }

    return msgs;
  }
}

function checkStyleTag(
  style: HTMLStyleTag,
  store: Store,
  ruleId: string,
  severity: Severity,
  msgs: LintMessage[]
): void {
  for (const ruleMatch of style.content.matchAll(cssRuleBlockRegex)) {
    const selector = ruleMatch[1];
    const blockContent = ruleMatch[2];
    const blockStart = ruleMatch.index + ruleMatch[0].indexOf(blockContent);

    const tagName = extractTagName(selector);
    const decl = getCustomElementDecl(tagName, store);
    if (!decl) continue;

    collectBlockMessages(style, blockContent, blockStart, tagName, decl, ruleId, severity, msgs);
  }
}

function collectBlockMessages(
  style: HTMLStyleTag,
  blockContent: string,
  blockStart: number,
  tagName: string,
  decl: Declaration,
  ruleId: string,
  severity: Severity,
  msgs: LintMessage[]
): void {
  const propSet = buildPropSet(decl);
  for (const propMatch of blockContent.matchAll(cssCustomPropRegex)) {
    const propName = propMatch[1];
    if (propSet.has(propName)) continue;

    const absOffset = blockStart + propMatch.index;
    const { line, col } = computeStylePosition(style, absOffset);
    msgs.push({
      ruleId,
      severity,
      message: `Unknown CSS custom property "${propName}" on <${tagName}>. ${formatCSSPropNames(decl.cssProperties ?? [])}`,
      line,
      column: col
    });
  }
}

function checkInlineStyle(
  elem: HTMLElement,
  store: Store,
  ruleId: string,
  severity: Severity,
  msgs: LintMessage[]
): void {
  if (!isCustomElement(elem.tagName)) return;

  for (const attr of elem.attributes) {
    if (attr.name !== 'style' || !attr.hasValue) continue;

    const decl = store.getElement(elem.tagName);
    if (!decl) continue;

    const propSet = buildPropSet(decl);
    for (const propMatch of attr.value.matchAll(cssCustomPropRegex)) {
      const propName = propMatch[1];
      if (propSet.has(propName)) continue;

      msgs.push({
        ruleId,
        severity,
        message: `Unknown CSS custom property "${propName}" on <${elem.tagName}>. ${formatCSSPropNames(decl.cssProperties ?? [])}`,
        line: attr.line,
        column: attr.column
      });
    }
  }
}

function getCustomElementDecl(tagName: string, store: Store): Declaration | undefined {
  if (!isCustomElement(tagName)) return undefined;
  return store.getElement(tagName);
}

function buildPropSet(decl: Declaration): Set<string> {
  return new Set((decl.cssProperties ?? []).map(p => p.name));
}

function formatCSSPropNames(props: CSSProperty[]): string {
  return formatSuggestion(
    props.map(p => p.name),
    'CSS properties',
    'Valid CSS properties'
  );
}
