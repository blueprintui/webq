import type { Store } from '../elements/store.js';
import {
  Severity,
  type Rule,
  type LintResult,
  type ValidateConfig,
  type VerifyStores,
  isConfigurableRule,
  isPatternAwareRule,
  isStyleAwareRule,
  isCustomAttrAwareRule
} from './types.js';
import { parseHTML } from './html.js';

const defaultRules: Rule[] = [];

export function registerRule(r: Rule): void {
  if (defaultRules.some(existing => existing.id() === r.id())) return;
  defaultRules.push(r);
}

export function allRules(): Rule[] {
  return defaultRules;
}

export function getRule(id: string): Rule | undefined {
  return defaultRules.find(r => r.id() === id);
}

export function verify(
  html: string,
  store: Store,
  rules: Rule[],
  cfg?: ValidateConfig,
  stores?: VerifyStores
): LintResult {
  const doc = parseHTML(html);
  const result: LintResult = {
    messages: [],
    errorCount: 0,
    warningCount: 0
  };

  const vs = stores ?? {};

  for (const rule of rules) {
    // Check if rule is turned off via config
    if (cfg) {
      const sev = cfg.ruleSeverities.get(rule.id());
      if (sev !== undefined && sev === Severity.Off) continue;
    }

    // Always reset configurable rules
    if (isConfigurableRule(rule)) {
      if (cfg) {
        rule.configure(cfg.ruleOptions.get(rule.id()) ?? {});
      } else {
        rule.configure({});
      }
    }

    // Set pattern store
    if (isPatternAwareRule(rule)) {
      rule.setPatternStore(vs.patternStore);
    }

    // Set custom style store
    if (isStyleAwareRule(rule)) {
      rule.setCustomStyleStore(vs.customStyleStore);
    }

    // Set custom attribute store
    if (isCustomAttrAwareRule(rule)) {
      rule.setCustomAttributeStore(vs.customAttributeStore);
    }

    const msgs = rule.check(doc, store);
    for (const msg of msgs) {
      const finalMsg = { ...msg };
      // Override severity from config
      if (cfg) {
        const sev = cfg.ruleSeverities.get(msg.ruleId);
        if (sev !== undefined) {
          finalMsg.severity = sev;
        }
      }

      result.messages.push(finalMsg);
      if (finalMsg.severity === Severity.Error) {
        result.errorCount++;
      } else if (finalMsg.severity === Severity.Warning) {
        result.warningCount++;
      }
    }
  }

  return result;
}
