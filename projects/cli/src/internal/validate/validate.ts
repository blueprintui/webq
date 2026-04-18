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
  if (defaultRules.some(existing => existing.id === r.id)) return;
  defaultRules.push(r);
}

export function allRules(): Rule[] {
  return defaultRules;
}

export function getRule(id: string): Rule | undefined {
  return defaultRules.find(r => r.id === id);
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
    if (isRuleDisabled(rule, cfg)) continue;
    configureRule(rule, cfg);
    injectStores(rule, vs);
    collectMessages(rule, doc, store, cfg, result);
  }

  return result;
}

function isRuleDisabled(rule: Rule, cfg?: ValidateConfig): boolean {
  if (!cfg) return false;
  const sev = cfg.ruleSeverities.get(rule.id);
  return sev !== undefined && sev === Severity.Off;
}

function configureRule(rule: Rule, cfg?: ValidateConfig): void {
  if (!isConfigurableRule(rule)) return;
  const opts = cfg ? (cfg.ruleOptions.get(rule.id) ?? {}) : {};
  rule.configure(opts);
}

function injectStores(rule: Rule, vs: VerifyStores): void {
  if (isPatternAwareRule(rule)) rule.setPatternStore(vs.patternStore);
  if (isStyleAwareRule(rule)) rule.setCustomStyleStore(vs.customStyleStore);
  if (isCustomAttrAwareRule(rule)) rule.setCustomAttributeStore(vs.customAttributeStore);
}

function collectMessages(
  rule: Rule,
  doc: ReturnType<typeof parseHTML>,
  store: Store,
  cfg: ValidateConfig | undefined,
  result: LintResult
): void {
  const msgs = rule.check(doc, store);
  for (const msg of msgs) {
    const finalMsg = { ...msg };
    if (cfg) {
      const sev = cfg.ruleSeverities.get(msg.ruleId);
      if (sev !== undefined) finalMsg.severity = sev;
    }
    result.messages.push(finalMsg);
    if (finalMsg.severity === Severity.Error) {
      result.errorCount++;
    } else if (finalMsg.severity === Severity.Warning) {
      result.warningCount++;
    }
  }
}
