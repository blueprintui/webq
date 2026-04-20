import { z as zod } from 'zod/v3';
import { formatCSSCustomPropertySummaries } from '../../../cli/format.js';
import type { ToolContext } from '../../tools.js';
import type { CSSCustomPropertySummary } from '../store.js';

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
  inputSchema: zod.object({})
};

export function toMarkdown(ctx: ToolContext): string {
  if (!ctx.customStyleStore) return 'No custom-styles.json found\n';
  return formatCSSCustomPropertySummaries(ctx.customStyleStore.getCSSCustomProperties());
}

export function toJSON(ctx: ToolContext): { properties: CSSCustomPropertySummary[] } {
  if (!ctx.customStyleStore) return { properties: [] };
  const summaries = ctx.customStyleStore.getCSSCustomProperties();
  return {
    properties: summaries.map(summary => ({
      name: summary.name,
      description: summary.description,
      type: summary.type,
      tags: summary.tags
    }))
  };
}
