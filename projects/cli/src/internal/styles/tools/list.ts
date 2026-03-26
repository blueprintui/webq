import z from 'zod/v3';
import { formatCSSCustomPropertySummaries } from '../../../cli/format.js';
import type { ToolContext } from '../../tools.js';

export const metadata = {
  command: 'style.property.list',
  toolName: 'style_property_list',
  summary: 'List all CSS custom properties',
  description: 'List all CSS custom properties defined in custom styles.',
  annotations: {
    readOnlyHint: true as const,
    destructiveHint: false as const,
    openWorldHint: false as const
  },
  inputSchema: z.object({})
};

export function toMarkdown(ctx: ToolContext) {
  if (!ctx.customStyleStore) return 'No custom-styles.json found\n';
  return formatCSSCustomPropertySummaries(ctx.customStyleStore.getCSSCustomProperties());
}

export function toJSON(ctx: ToolContext) {
  if (!ctx.customStyleStore) return { properties: [] };
  const summaries = ctx.customStyleStore.getCSSCustomProperties();
  return {
    properties: summaries.map(s => ({
      name: s.name,
      description: s.description,
      type: s.type,
      tags: s.tags
    }))
  };
}
