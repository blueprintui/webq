import type { Store } from '../../elements/store.js';
import type { CSSProperty } from '../../elements/types.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { isCustomElement } from '../schema.js';
import { formatSuggestion } from './suggestion.js';
import { computeStylePosition } from './no-unknown-css-part.js';
import { cssRuleBlockRegex, cssCustomPropRegex, extractTagName } from './css-helpers.js';

export class NoUnknownCSSCustomProperty implements Rule {
  id() {
    return 'no-unknown-css-custom-property';
  }
  severity() {
    return Severity.Error;
  }

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];

    // Check <style> tags
    for (const style of doc.styleTags) {
      for (const ruleMatch of style.content.matchAll(cssRuleBlockRegex)) {
        const selector = ruleMatch[1];
        const blockContent = ruleMatch[2];
        const blockStart = ruleMatch.index + ruleMatch[0].indexOf(blockContent);

        const tagName = extractTagName(selector);
        if (!isCustomElement(tagName)) continue;

        const decl = store.getElement(tagName);
        if (!decl) continue;

        const propSet = new Set((decl.cssProperties ?? []).map(p => p.name));

        for (const propMatch of blockContent.matchAll(cssCustomPropRegex)) {
          const propName = propMatch[1];
          if (!propSet.has(propName)) {
            const absOffset = blockStart + propMatch.index;
            const { line, col } = computeStylePosition(style, absOffset);
            const suggestion = formatCSSPropNames(decl.cssProperties ?? []);
            msgs.push({
              ruleId: this.id(),
              severity: this.severity(),
              message: `Unknown CSS custom property "${propName}" on <${tagName}>. ${suggestion}`,
              line,
              column: col
            });
          }
        }
      }
    }

    // Check inline style attributes
    for (const elem of doc.elements) {
      if (!isCustomElement(elem.tagName)) continue;

      for (const attr of elem.attributes) {
        if (attr.name !== 'style' || !attr.hasValue) continue;

        const decl = store.getElement(elem.tagName);
        if (!decl) continue;

        const propSet = new Set((decl.cssProperties ?? []).map(p => p.name));

        for (const propMatch of attr.value.matchAll(cssCustomPropRegex)) {
          const propName = propMatch[1];
          if (!propSet.has(propName)) {
            const suggestion = formatCSSPropNames(decl.cssProperties ?? []);
            msgs.push({
              ruleId: this.id(),
              severity: this.severity(),
              message: `Unknown CSS custom property "${propName}" on <${elem.tagName}>. ${suggestion}`,
              line: attr.line,
              column: attr.column
            });
          }
        }
      }
    }

    return msgs;
  }
}

function formatCSSPropNames(props: CSSProperty[]): string {
  return formatSuggestion(
    props.map(p => p.name),
    'CSS properties',
    'Valid CSS properties'
  );
}
