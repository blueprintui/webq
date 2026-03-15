import type { Store } from '../elements/store.js';
import type { Type, Parameter, Return } from '../elements/types.js';
import { KindField, KindMethod } from '../elements/types.js';
import { ErrElementNotFound } from '../elements/errors.js';
import type { PatternStore } from '../patterns/store.js';
import type { Pattern } from '../patterns/types.js';
import type { CustomAttributeStore } from '../attributes/store.js';
import type { CustomAttribute } from '../attributes/types.js';
import type { CustomStyleStore } from '../styles/store.js';
import type { CSSCustomProperty } from '../styles/types.js';
import type { ValidateConfig, Rule, LintResult } from '../validate/types.js';
import { verify, allRules, getRule } from '../validate/validate.js';

// Input types
export interface TagNameInput {
  tagName: string;
}
export interface VerifyInput {
  html: string;
  rule?: string;
}
export interface PatternNameInput {
  name: string;
}
export interface CustomAttributeNameInput {
  name: string;
}
export interface CSSCustomPropertyNameInput {
  name: string;
}

// Output types
export interface TypeInfo {
  text: string;
}
export interface ElementSummary {
  tagName: string;
  description?: string;
}
export interface ElementsOutput {
  elements: ElementSummary[];
}
export interface AttributeInfo {
  name: string;
  description?: string;
  type?: TypeInfo;
  default?: string;
  fieldName?: string;
  reflects?: boolean;
  deprecated?: string;
}
export interface AttributesOutput {
  tagName: string;
  attributes: AttributeInfo[];
}
export interface PropertyInfo {
  name: string;
  description?: string;
  type?: TypeInfo;
  default?: string;
  privacy?: string;
  readonly?: boolean;
}
export interface PropertiesOutput {
  tagName: string;
  properties: PropertyInfo[];
}
export interface ParameterInfo {
  name: string;
  description?: string;
  type?: TypeInfo;
  default?: string;
  optional?: boolean;
}
export interface ReturnInfo {
  type?: TypeInfo;
  description?: string;
}
export interface MethodInfo {
  name: string;
  description?: string;
  privacy?: string;
  parameters?: ParameterInfo[];
  return?: ReturnInfo;
}
export interface MethodsOutput {
  tagName: string;
  methods: MethodInfo[];
}
export interface EventInfo {
  name: string;
  description?: string;
  type?: TypeInfo;
  deprecated?: string;
}
export interface EventsOutput {
  tagName: string;
  events: EventInfo[];
}
export interface SlotInfo {
  name: string;
  description?: string;
  deprecated?: string;
}
export interface SlotsOutput {
  tagName: string;
  slots: SlotInfo[];
}
export interface CommandInfo {
  name: string;
  description?: string;
  deprecated?: string;
}
export interface CommandsOutput {
  tagName: string;
  commands: CommandInfo[];
}
export interface CSSPropertyInfo {
  name: string;
  description?: string;
  default?: string;
  deprecated?: string;
}
export interface CSSPropertiesOutput {
  tagName: string;
  cssProperties: CSSPropertyInfo[];
}
export interface CSSPartInfo {
  name: string;
  description?: string;
  deprecated?: string;
}
export interface CSSPartsOutput {
  tagName: string;
  cssParts: CSSPartInfo[];
}
export interface ElementOutput {
  tagName: string;
  name: string;
  description?: string;
  attributes: AttributeInfo[];
  properties: PropertyInfo[];
  methods: MethodInfo[];
  events: EventInfo[];
  slots: SlotInfo[];
  commands: CommandInfo[];
  cssProperties: CSSPropertyInfo[];
  cssParts: CSSPartInfo[];
}
export interface PatternSummaryOutput {
  name: string;
  description: string;
  tags?: string[];
}
export interface PatternsOutput {
  patterns: PatternSummaryOutput[];
}
export interface CustomAttributeSummaryOutput {
  name: string;
  description: string;
  syntax?: string;
  tags?: string[];
}
export interface CustomAttributesOutput {
  attributes: CustomAttributeSummaryOutput[];
}
export interface CSSCustomPropertySummaryOutput {
  name: string;
  description?: string;
  type?: string;
  tags?: string[];
}
export interface CSSCustomPropertiesOutput {
  properties: CSSCustomPropertySummaryOutput[];
}

// Helpers
function toTypeInfo(t?: Type): TypeInfo | undefined {
  if (!t) return undefined;
  return { text: t.text };
}

function toParameterInfo(p: Parameter): ParameterInfo {
  return {
    name: p.name,
    description: p.description,
    type: toTypeInfo(p.type),
    default: p.default,
    optional: p.optional
  };
}

function toReturnInfo(r?: Return): ReturnInfo | undefined {
  if (!r) return undefined;
  return { type: toTypeInfo(r.type), description: r.description };
}

// Tool handlers
export function handleListElements(store: Store): ElementsOutput {
  const summaries = store.getElementSummaries();
  return {
    elements: summaries.map(s => ({
      tagName: s.tagName,
      description: s.description
    }))
  };
}

export function handleGetElement(store: Store, tagName: string): ElementOutput | string {
  const element = store.getElement(tagName);
  if (!element) return new ErrElementNotFound(tagName).message;

  const output: ElementOutput = {
    tagName: element.tagName as string,
    name: element.name,
    description: element.description,
    attributes: [],
    properties: [],
    methods: [],
    events: [],
    slots: [],
    commands: [],
    cssProperties: [],
    cssParts: []
  };

  for (const attr of element.attributes ?? []) {
    output.attributes.push({
      name: attr.name,
      description: attr.description,
      type: toTypeInfo(attr.type),
      default: attr.default,
      fieldName: attr.fieldName,
      reflects: attr.reflects,
      deprecated: attr.deprecated
    });
  }

  for (const member of element.members ?? []) {
    if (member.kind === KindField) {
      output.properties.push({
        name: member.name,
        description: member.description,
        type: toTypeInfo(member.type),
        default: member.default,
        privacy: member.privacy,
        readonly: member.readonly
      });
    } else if (member.kind === KindMethod) {
      const method: MethodInfo = {
        name: member.name,
        description: member.description,
        privacy: member.privacy,
        return: toReturnInfo(member.return)
      };
      if (member.parameters) method.parameters = member.parameters.map(toParameterInfo);
      output.methods.push(method);
    }
  }

  for (const event of element.events ?? []) {
    output.events.push({
      name: event.name,
      description: event.description,
      type: toTypeInfo(event.type),
      deprecated: event.deprecated
    });
  }
  for (const slot of element.slots ?? []) {
    output.slots.push({
      name: slot.name,
      description: slot.description,
      deprecated: slot.deprecated
    });
  }
  for (const cmd of element.commands ?? []) {
    output.commands.push({
      name: cmd.name,
      description: cmd.description,
      deprecated: cmd.deprecated
    });
  }
  for (const prop of element.cssProperties ?? []) {
    output.cssProperties.push({
      name: prop.name,
      description: prop.description,
      default: prop.default,
      deprecated: prop.deprecated
    });
  }
  for (const part of element.cssParts ?? []) {
    output.cssParts.push({
      name: part.name,
      description: part.description,
      deprecated: part.deprecated
    });
  }

  return output;
}

export function handleGetAttributes(store: Store, tagName: string): AttributesOutput | string {
  const element = store.getElement(tagName);
  if (!element) return new ErrElementNotFound(tagName).message;
  return {
    tagName,
    attributes: (element.attributes ?? []).map(a => ({
      name: a.name,
      description: a.description,
      type: toTypeInfo(a.type),
      default: a.default,
      fieldName: a.fieldName,
      reflects: a.reflects,
      deprecated: a.deprecated
    }))
  };
}

export function handleGetProperties(store: Store, tagName: string): PropertiesOutput | string {
  const element = store.getElement(tagName);
  if (!element) return new ErrElementNotFound(tagName).message;
  const props = store.getProperties(tagName);
  return {
    tagName,
    properties: props.map(p => ({
      name: p.name,
      description: p.description,
      type: toTypeInfo(p.type),
      default: p.default,
      privacy: p.privacy,
      readonly: p.readonly
    }))
  };
}

export function handleGetMethods(store: Store, tagName: string): MethodsOutput | string {
  const element = store.getElement(tagName);
  if (!element) return new ErrElementNotFound(tagName).message;
  const methods = store.getMethods(tagName);
  return {
    tagName,
    methods: methods.map(m => {
      const info: MethodInfo = {
        name: m.name,
        description: m.description,
        privacy: m.privacy,
        return: toReturnInfo(m.return)
      };
      if (m.parameters) info.parameters = m.parameters.map(toParameterInfo);
      return info;
    })
  };
}

export function handleGetEvents(store: Store, tagName: string): EventsOutput | string {
  const element = store.getElement(tagName);
  if (!element) return new ErrElementNotFound(tagName).message;
  return {
    tagName,
    events: (element.events ?? []).map(e => ({
      name: e.name,
      description: e.description,
      type: toTypeInfo(e.type),
      deprecated: e.deprecated
    }))
  };
}

export function handleGetSlots(store: Store, tagName: string): SlotsOutput | string {
  const element = store.getElement(tagName);
  if (!element) return new ErrElementNotFound(tagName).message;
  return {
    tagName,
    slots: (element.slots ?? []).map(s => ({
      name: s.name,
      description: s.description,
      deprecated: s.deprecated
    }))
  };
}

export function handleGetCommands(store: Store, tagName: string): CommandsOutput | string {
  const element = store.getElement(tagName);
  if (!element) return new ErrElementNotFound(tagName).message;
  return {
    tagName,
    commands: (element.commands ?? []).map(c => ({
      name: c.name,
      description: c.description,
      deprecated: c.deprecated
    }))
  };
}

export function handleGetCSSProperties(store: Store, tagName: string): CSSPropertiesOutput | string {
  const element = store.getElement(tagName);
  if (!element) return new ErrElementNotFound(tagName).message;
  return {
    tagName,
    cssProperties: (element.cssProperties ?? []).map(p => ({
      name: p.name,
      description: p.description,
      default: p.default,
      deprecated: p.deprecated
    }))
  };
}

export function handleGetCSSParts(store: Store, tagName: string): CSSPartsOutput | string {
  const element = store.getElement(tagName);
  if (!element) return new ErrElementNotFound(tagName).message;
  return {
    tagName,
    cssParts: (element.cssParts ?? []).map(p => ({
      name: p.name,
      description: p.description,
      deprecated: p.deprecated
    }))
  };
}

export function handleValidateHTML(
  html: string,
  store: Store,
  validateCfg: ValidateConfig | undefined,
  patternStore: PatternStore | undefined,
  customStyleStore: CustomStyleStore | undefined,
  customAttrStore: CustomAttributeStore | undefined,
  ruleId?: string
): LintResult | string {
  let rules: Rule[];
  if (ruleId) {
    const r = getRule(ruleId);
    if (!r) return `unknown rule "${ruleId}"`;
    rules = [r];
  } else {
    rules = allRules();
  }
  return verify(html, store, rules, validateCfg, {
    patternStore,
    customStyleStore,
    customAttributeStore: customAttrStore
  });
}

export function handleListPatterns(patternStore?: PatternStore): PatternsOutput {
  if (!patternStore) return { patterns: [] };
  const summaries = patternStore.getPatterns();
  return {
    patterns: summaries.map(s => ({
      name: s.name,
      description: s.description,
      tags: s.tags
    }))
  };
}

export function handleGetPattern(patternStore: PatternStore | undefined, name: string): Pattern | string {
  if (!patternStore) return 'No patterns file loaded';
  const pattern = patternStore.getPattern(name);
  if (!pattern) return `Pattern "${name}" not found`;
  return pattern;
}

export function handleListCustomAttributes(customAttrStore?: CustomAttributeStore): CustomAttributesOutput {
  if (!customAttrStore) return { attributes: [] };
  const summaries = customAttrStore.getCustomAttributes();
  return {
    attributes: summaries.map(s => ({
      name: s.name,
      description: s.description,
      syntax: s.syntax,
      tags: s.tags
    }))
  };
}

export function handleGetCustomAttribute(
  customAttrStore: CustomAttributeStore | undefined,
  name: string
): CustomAttribute | string {
  if (!customAttrStore) return 'No custom attributes file loaded';
  const attr = customAttrStore.getCustomAttribute(name);
  if (!attr) return `Custom attribute "${name}" not found`;
  return attr;
}

export function handleListCustomStyles(customStyleStore?: CustomStyleStore): CSSCustomPropertiesOutput {
  if (!customStyleStore) return { properties: [] };
  const summaries = customStyleStore.getCSSCustomProperties();
  return {
    properties: summaries.map(s => ({
      name: s.name,
      description: s.description,
      type: s.type,
      tags: s.tags
    }))
  };
}

export function handleGetCustomStyle(
  customStyleStore: CustomStyleStore | undefined,
  name: string
): CSSCustomProperty | string {
  if (!customStyleStore) return 'No custom styles file loaded';
  const prop = customStyleStore.getCSSCustomProperty(name);
  if (!prop) return `CSS custom property "${name}" not found`;
  return prop;
}
