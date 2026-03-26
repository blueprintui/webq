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
  const output: ElementOutput = {
    tagName: element.tagName,
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
