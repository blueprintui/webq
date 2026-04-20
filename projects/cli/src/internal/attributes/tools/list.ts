import { z as zod } from 'zod/v3';
import { formatCustomAttributeSummaries } from '../../../cli/format.js';
import type { ToolContext } from '../../tools.js';
import type { CustomAttributeSummary } from '../store.js';

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
  inputSchema: zod.object({})
};

export function toMarkdown(ctx: ToolContext): string {
  if (!ctx.customAttrStore) return 'No custom-attributes.json found\n';
  return formatCustomAttributeSummaries(ctx.customAttrStore.getCustomAttributes());
}

export function toJSON(ctx: ToolContext): { attributes: CustomAttributeSummary[] } {
  if (!ctx.customAttrStore) return { attributes: [] };
  const summaries = ctx.customAttrStore.getCustomAttributes();
  return {
    attributes: summaries.map(summary => ({
      name: summary.name,
      description: summary.description,
      syntax: summary.syntax,
      tags: summary.tags
    }))
  };
}
