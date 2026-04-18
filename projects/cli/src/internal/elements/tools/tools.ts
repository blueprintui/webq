import type { ToolContext } from '../../tools.js';
import type { Declaration, Type, Parameter, Return } from '../types.js';
import { KindField, KindMethod } from '../types.js';
import { ErrElementNotFound } from '../errors.js';

// Output types
export interface TypeInfo {
  text: string;
}

export interface ElementSummaryOutput {
  tagName: string;
  description?: string;
}

export interface ElementsOutput {
  elements: ElementSummaryOutput[];
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

// Shared helpers
export function toTypeInfo(t?: Type): TypeInfo | undefined {
  if (!t) return undefined;
  return { text: t.text };
}

export function toParameterInfo(p: Parameter): ParameterInfo {
  return {
    name: p.name,
    description: p.description,
    type: toTypeInfo(p.type),
    default: p.default,
    optional: p.optional
  };
}

export function toReturnInfo(r?: Return): ReturnInfo | undefined {
  if (!r) return undefined;
  return { type: toTypeInfo(r.type), description: r.description };
}

export function getElementOrThrow(ctx: ToolContext, tagName: string): Declaration & { tagName: string } {
  const element = ctx.store.getElement(tagName);
  if (!element) throw new ErrElementNotFound(tagName);
  return element as Declaration & { tagName: string };
}

export function buildElementOutput(ctx: ToolContext, tagName: string): ElementOutput {
  const element = getElementOrThrow(ctx, tagName);
  return {
    tagName: element.tagName,
    name: element.name,
    description: element.description,
    attributes: buildAttributes(element),
    properties: buildProperties(element),
    methods: buildMethods(element),
    events: buildEvents(element),
    slots: buildSlots(element),
    commands: buildCommands(element),
    cssProperties: buildCSSProperties(element),
    cssParts: buildCSSParts(element)
  };
}

function buildAttributes(element: Declaration): AttributeInfo[] {
  const out: AttributeInfo[] = [];
  for (const attr of element.attributes ?? []) {
    out.push({
      name: attr.name,
      description: attr.description,
      type: toTypeInfo(attr.type),
      default: attr.default,
      fieldName: attr.fieldName,
      reflects: attr.reflects,
      deprecated: attr.deprecated
    });
  }
  return out;
}

function buildProperties(element: Declaration): PropertyInfo[] {
  const out: PropertyInfo[] = [];
  for (const member of element.members ?? []) {
    if (member.kind !== KindField) continue;
    out.push({
      name: member.name,
      description: member.description,
      type: toTypeInfo(member.type),
      default: member.default,
      privacy: member.privacy,
      readonly: member.readonly
    });
  }
  return out;
}

function buildMethods(element: Declaration): MethodInfo[] {
  const out: MethodInfo[] = [];
  for (const member of element.members ?? []) {
    if (member.kind !== KindMethod) continue;
    const method: MethodInfo = {
      name: member.name,
      description: member.description,
      privacy: member.privacy,
      return: toReturnInfo(member.return)
    };
    if (member.parameters) method.parameters = member.parameters.map(toParameterInfo);
    out.push(method);
  }
  return out;
}

function buildEvents(element: Declaration): EventInfo[] {
  const out: EventInfo[] = [];
  for (const event of element.events ?? []) {
    out.push({
      name: event.name,
      description: event.description,
      type: toTypeInfo(event.type),
      deprecated: event.deprecated
    });
  }
  return out;
}

function buildSlots(element: Declaration): SlotInfo[] {
  const out: SlotInfo[] = [];
  for (const slot of element.slots ?? []) {
    out.push({
      name: slot.name,
      description: slot.description,
      deprecated: slot.deprecated
    });
  }
  return out;
}

function buildCommands(element: Declaration): CommandInfo[] {
  const out: CommandInfo[] = [];
  for (const cmd of element.commands ?? []) {
    out.push({
      name: cmd.name,
      description: cmd.description,
      deprecated: cmd.deprecated
    });
  }
  return out;
}

function buildCSSProperties(element: Declaration): CSSPropertyInfo[] {
  const out: CSSPropertyInfo[] = [];
  for (const prop of element.cssProperties ?? []) {
    out.push({
      name: prop.name,
      description: prop.description,
      default: prop.default,
      deprecated: prop.deprecated
    });
  }
  return out;
}

function buildCSSParts(element: Declaration): CSSPartInfo[] {
  const out: CSSPartInfo[] = [];
  for (const part of element.cssParts ?? []) {
    out.push({
      name: part.name,
      description: part.description,
      deprecated: part.deprecated
    });
  }
  return out;
}
