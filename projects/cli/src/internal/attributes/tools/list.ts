import z from 'zod/v3';
import { formatCustomAttributeSummaries } from '../../../cli/format.js';
import type { ToolContext } from '../../tools.js';

export const metadata = {
  command: 'attribute.list',
  toolName: 'attribute_get_list',
  summary: 'List all custom attributes',
  description: 'List all custom attributes.',
  annotations: {
    readOnlyHint: true as const,
    destructiveHint: false as const,
    openWorldHint: false as const
  },
  inputSchema: z.object({})
};

export function toMarkdown(ctx: ToolContext) {
  if (!ctx.customAttrStore) return 'No custom-attributes.json found\n';
  return formatCustomAttributeSummaries(ctx.customAttrStore.getCustomAttributes());
}

export function toJSON(ctx: ToolContext) {
  if (!ctx.customAttrStore) return { attributes: [] };
  const summaries = ctx.customAttrStore.getCustomAttributes();
  return {
    attributes: summaries.map(s => ({
      name: s.name,
      description: s.description,
      syntax: s.syntax,
      tags: s.tags
    }))
  };
}
