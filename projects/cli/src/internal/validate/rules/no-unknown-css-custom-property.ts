import type { Store } from '../../elements/store.js';
import type { CSSProperty, Declaration } from '../../elements/types.js';
import type { HTMLElement, HTMLStyleTag } from '../types.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { isCustomElement } from '../schema.js';
import { formatSuggestion } from './suggestion.js';
import { computeStylePosition, cssRuleBlockRegex, cssCustomPropRegex, extractTagName } from './css-helpers.js';

export class NoUnknownCSSCustomProperty implements Rule {
  readonly id: string;
  readonly severity: Severity;

  constructor() {
    this.id = 'no-unknown-css-custom-property';
    this.severity = Severity.Error;
  }

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];
    const ctx: RuleMeta = { ruleId: this.id, severity: this.severity, store };

    for (const style of doc.styleTags) {
      checkStyleTag(ctx, style, msgs);
    }

    for (const elem of doc.elements) {
      checkInlineStyle(ctx, elem, msgs);
    }

    return msgs;
  }
}

interface RuleMeta {
  ruleId: string;
  severity: Severity;
  store: Store;
}

interface BlockContext {
  style: HTMLStyleTag;
  blockContent: string;
  blockStart: number;
  tagName: string;
  decl: Declaration;
  ruleId: string;
  severity: Severity;
}

function checkStyleTag(ctx: RuleMeta, style: HTMLStyleTag, msgs: LintMessage[]): void {
  for (const ruleMatch of style.content.matchAll(cssRuleBlockRegex)) {
    const selector = ruleMatch[1];
    const blockContent = ruleMatch[2];
    const blockStart = ruleMatch.index + ruleMatch[0].indexOf(blockContent);

    const tagName = extractTagName(selector);
    const decl = getCustomElementDecl(tagName, ctx.store);
    if (!decl) continue;

    collectBlockMessages(
      {
        style,
        blockContent,
        blockStart,
        tagName,
        decl,
        ruleId: ctx.ruleId,
        severity: ctx.severity
      },
      msgs
    );
  }
}

function collectBlockMessages(ctx: BlockContext, msgs: LintMessage[]): void {
  const { style, blockContent, blockStart, tagName, decl, ruleId, severity } = ctx;
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

function checkInlineStyle(ctx: RuleMeta, elem: HTMLElement, msgs: LintMessage[]): void {
  if (!isCustomElement(elem.tagName)) return;

  for (const attr of elem.attributes) {
    if (attr.name !== 'style' || !attr.hasValue) continue;

    const decl = ctx.store.getElement(elem.tagName);
    if (!decl) continue;

    const propSet = buildPropSet(decl);
    for (const propMatch of attr.value.matchAll(cssCustomPropRegex)) {
      const propName = propMatch[1];
      if (propSet.has(propName)) continue;

      msgs.push({
        ruleId: ctx.ruleId,
        severity: ctx.severity,
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
  return new Set((decl.cssProperties ?? []).map(prop => prop.name));
}

function formatCSSPropNames(props: CSSProperty[]): string {
  return formatSuggestion(
    props.map(prop => prop.name),
    'CSS properties',
    'Valid CSS properties'
  );
}
