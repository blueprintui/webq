import { z as zod } from 'zod/v3';
import { formatMembersValue } from '../../../cli/format.js';
import type { ToolContext } from '../../tools.js';
import { KindField } from '../types.js';
import type { PropertiesOutput } from './tools.js';
import { getElementOrThrow, toTypeInfo } from './tools.js';

const tagNameSchema = zod.object({
  tagName: zod.string().describe("The tag name of the custom element (e.g. 'my-button')")
});

export const metadata = {
  command: 'element.properties <tag-name>',
  toolName: 'element_get_properties',
  summary: 'Get properties for a custom element',
  description: 'Get JavaScript properties (fields) for a custom element.',
  annotations: {
    readOnlyHint: true as const,
    destructiveHint: false as const,
    openWorldHint: false as const
  },
  inputSchema: tagNameSchema
};

export function toMarkdown(ctx: ToolContext, input: { tagName: string }): string {
  const element = getElementOrThrow(ctx, input.tagName);
  const props = (element.members ?? []).filter(member => member.kind === KindField);
  return formatMembersValue(props, input.tagName, 'Properties');
}

export function toJSON(ctx: ToolContext, input: { tagName: string }): PropertiesOutput {
  const element = getElementOrThrow(ctx, input.tagName);
  const props = (element.members ?? []).filter(member => member.kind === KindField);
  return {
    tagName: input.tagName,
    properties: props.map(prop => ({
      name: prop.name,
      description: prop.description,
      type: toTypeInfo(prop.type),
      default: prop.default,
      privacy: prop.privacy,
      readonly: prop.readonly
    }))
  };
}
