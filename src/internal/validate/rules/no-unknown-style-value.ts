import type { Store } from '../../elements/store.js';
import type { CustomStyleStore } from '../../styles/store.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { isCustomElement } from '../schema.js';
import { computeStylePosition } from './no-unknown-css-part.js';
import { cssRuleBlockRegex, cssVarRefRegex, extractTagName } from './css-helpers.js';

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
      cssRuleBlockRegex.lastIndex = 0;
      let ruleMatch: RegExpExecArray | null;
      while ((ruleMatch = cssRuleBlockRegex.exec(style.content)) !== null) {
        const selector = ruleMatch[1];
        const blockContent = ruleMatch[2];
        const blockStart = ruleMatch.index + ruleMatch[0].indexOf(blockContent);

        const tagName = extractTagName(selector);
        let elemPropSet: Set<string> | undefined;
        if (isCustomElement(tagName)) {
          const decl = store.getElement(tagName);
          if (decl) {
            elemPropSet = new Set((decl.cssProperties ?? []).map(p => p.name));
          }
        }

        cssVarRefRegex.lastIndex = 0;
        let varMatch: RegExpExecArray | null;
        while ((varMatch = cssVarRefRegex.exec(blockContent)) !== null) {
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

        let elemPropSet: Set<string> | undefined;
        const decl = store.getElement(elem.tagName);
        if (decl) {
          elemPropSet = new Set((decl.cssProperties ?? []).map(p => p.name));
        }

        cssVarRefRegex.lastIndex = 0;
        let varMatch: RegExpExecArray | null;
        while ((varMatch = cssVarRefRegex.exec(attr.value)) !== null) {
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
