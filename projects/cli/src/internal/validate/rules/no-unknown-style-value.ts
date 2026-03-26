import type { Store } from '../../elements/store.js';
import type { CustomStyleStore } from '../../styles/store.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { isCustomElement } from '../schema.js';
import { computeStylePosition, cssRuleBlockRegex, cssVarRefRegex, extractTagName } from './css-helpers.js';

export class NoUnknownStyleValue implements Rule {
  #customStyleStore?: CustomStyleStore;

  id() {
    return 'no-unknown-style-value';
  }
  severity() {
    return Severity.Warning;
  }

  setCustomStyleStore(store: CustomStyleStore | undefined): void {
    this.#customStyleStore = store;
  }

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    if (!this.#customStyleStore) return [];
    const customStyleStore = this.#customStyleStore;

    const msgs: LintMessage[] = [];

    // Check <style> tags
    for (const style of doc.styleTags) {
      for (const ruleMatch of style.content.matchAll(cssRuleBlockRegex)) {
        const selector = ruleMatch[1];
        const blockContent = ruleMatch[2];
        const blockStart = ruleMatch.index + ruleMatch[0].indexOf(blockContent);

        const tagName = extractTagName(selector);
        const elemPropSet = buildCSSPropSet(store, tagName);

        for (const varMatch of blockContent.matchAll(cssVarRefRegex)) {
          const tokenName = varMatch[1];

          if (customStyleStore.getCSSCustomProperty(tokenName)) continue;
          if (elemPropSet?.has(tokenName)) continue;

          const absOffset = blockStart + varMatch.index;
          const { line, col } = computeStylePosition(style, absOffset);
          msgs.push({
            ruleId: this.id(),
            severity: this.severity(),
            message: `Unknown CSS custom property value "${tokenName}" is not defined in custom styles or element CSS properties.`,
            line,
            column: col
          });
        }
      }
    }

    // Check inline style attributes on custom elements
    for (const elem of doc.elements) {
      if (!isCustomElement(elem.tagName)) continue;

      for (const attr of elem.attributes) {
        if (attr.name !== 'style' || !attr.hasValue) continue;

        const elemPropSet = buildCSSPropSet(store, elem.tagName);

        for (const varMatch of attr.value.matchAll(cssVarRefRegex)) {
          const tokenName = varMatch[1];

          if (customStyleStore.getCSSCustomProperty(tokenName)) continue;
          if (elemPropSet?.has(tokenName)) continue;

          msgs.push({
            ruleId: this.id(),
            severity: this.severity(),
            message: `Unknown CSS custom property value "${tokenName}" is not defined in custom styles or element CSS properties.`,
            line: attr.line,
            column: attr.column
          });
        }
      }
    }

    return msgs;
  }
}

function buildCSSPropSet(store: Store, tagName: string): Set<string> | undefined {
  if (!isCustomElement(tagName)) return undefined;
  const decl = store.getElement(tagName);
  if (!decl) return undefined;
  return new Set((decl.cssProperties ?? []).map(p => p.name));
}
