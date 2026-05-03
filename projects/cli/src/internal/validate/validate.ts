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

interface VerifyOptions {
  cfg?: ValidateConfig;
  stores?: VerifyStores;
}

interface CollectContext {
  rule: Rule;
  doc: ReturnType<typeof parseHTML>;
  store: Store;
  cfg: ValidateConfig | undefined;
}

export function registerRule(rule: Rule): void {
  if (defaultRules.some(existing => existing.id === rule.id)) return;
  defaultRules.push(rule);
}

export function allRules(): Rule[] {
  return defaultRules;
}

export function getRule(id: string): Rule | undefined {
  return defaultRules.find(rule => rule.id === id);
}

export function verify(html: string, store: Store, rules: Rule[], options: VerifyOptions = {}): LintResult {
  const { cfg, stores } = options;
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
    collectMessages({ rule, doc, store, cfg }, result);
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

function collectMessages(ctx: CollectContext, result: LintResult): void {
  const { rule, doc, store, cfg } = ctx;
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
