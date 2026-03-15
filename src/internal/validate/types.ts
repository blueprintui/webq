import type { Store } from '../elements/store.js';
import type { PatternStore } from '../patterns/store.js';
import type { CustomStyleStore } from '../styles/store.js';
import type { CustomAttributeStore } from '../attributes/store.js';

export enum Severity {
  Off = 0,
  Warning = 1,
  Error = 2
}

export interface LintMessage {
  ruleId: string;
  severity: Severity;
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export interface LintResult {
  messages: LintMessage[];
  errorCount: number;
  warningCount: number;
}

export interface Rule {
  id(): string;
  severity(): Severity;
  check(doc: HTMLDocument, store: Store): LintMessage[];
}

export interface ValidateConfig {
  ruleSeverities: Map<string, Severity>;
  ruleOptions: Map<string, RuleOptionSet>;
}

export interface RuleOptionSet {
  tags?: string[];
  events?: string[];
}

export interface ConfigurableRule extends Rule {
  configure(opts: RuleOptionSet): void;
}

export interface PatternAwareRule extends Rule {
  setPatternStore(store: PatternStore | undefined): void;
}

export interface StyleAwareRule extends Rule {
  setCustomStyleStore(store: CustomStyleStore | undefined): void;
}

export interface CustomAttrAwareRule extends Rule {
  setCustomAttributeStore(store: CustomAttributeStore | undefined): void;
}

export interface VerifyStores {
  patternStore?: PatternStore;
  customStyleStore?: CustomStyleStore;
  customAttributeStore?: CustomAttributeStore;
}

export interface HTMLDocument {
  elements: HTMLElement[];
  styleTags: HTMLStyleTag[];
}

export interface HTMLElement {
  tagName: string;
  attributes: HTMLAttribute[];
  parent?: HTMLElement;
  children: HTMLElement[];
  line: number;
  column: number;
}

export interface HTMLAttribute {
  name: string;
  value: string;
  line: number;
  column: number;
  hasValue: boolean;
}

export interface HTMLStyleTag {
  content: string;
  contentLine: number;
  contentColumn: number;
}

export function isConfigurableRule(rule: Rule): rule is ConfigurableRule {
  return 'configure' in rule;
}

export function isPatternAwareRule(rule: Rule): rule is PatternAwareRule {
  return 'setPatternStore' in rule;
}

export function isStyleAwareRule(rule: Rule): rule is StyleAwareRule {
  return 'setCustomStyleStore' in rule;
}

export function isCustomAttrAwareRule(rule: Rule): rule is CustomAttrAwareRule {
  return 'setCustomAttributeStore' in rule;
}
