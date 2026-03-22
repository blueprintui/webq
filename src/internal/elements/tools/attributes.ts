import z from 'zod/v3';
import { formatAttributesValue } from '../../../cli/format.js';
import type { ToolContext } from '../../tools.js';
import type { AttributesOutput } from './tools.js';
import { getElementOrThrow, toTypeInfo } from './tools.js';

const tagNameSchema = z.object({
  tagName: z.string().describe("The tag name of the custom element (e.g. 'my-button')")
});

export const metadata = {
  command: 'element.attributes <tag-name>',
  toolName: 'element_get_attributes',
  summary: 'Get attributes for a custom element',
  description: 'Get HTML attributes for a custom element.',
  annotations: {
    readOnlyHint: true as const,
    destructiveHint: false as const,
    openWorldHint: false as const
  },
  inputSchema: tagNameSchema
};

export function toMarkdown(ctx: ToolContext, input: { tagName: string }) {
  const element = getElementOrThrow(ctx, input.tagName);
  return formatAttributesValue(element.attributes ?? [], input.tagName);
}

export function toJSON(ctx: ToolContext, input: { tagName: string }): AttributesOutput {
  const element = getElementOrThrow(ctx, input.tagName);
  return {
    tagName: input.tagName,
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
