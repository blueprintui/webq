import z from 'zod/v3';
import { formatCSSCustomPropertyDetail } from '../../../cli/format.js';
import type { ToolContext } from '../../tools.js';

export const metadata = {
  command: 'style.property <name>',
  toolName: 'style_property_get',
  summary: 'Get a CSS custom property',
  description: 'Get full details for a CSS custom property from custom styles.',
  annotations: {
    readOnlyHint: true as const,
    destructiveHint: false as const,
    openWorldHint: false as const
  },
  inputSchema: z.object({
    name: z.string().describe('The name of the CSS custom property')
  })
};

export function toMarkdown(ctx: ToolContext, input: { name: string }) {
  if (!ctx.customStyleStore) throw new Error('No custom styles file loaded');
  const prop = ctx.customStyleStore.getCSSCustomProperty(input.name);
  if (!prop) throw new Error(`CSS custom property "${input.name}" not found`);
  return formatCSSCustomPropertyDetail(prop);
}

export function toJSON(ctx: ToolContext, input: { name: string }) {
  if (!ctx.customStyleStore) throw new Error('No custom styles file loaded');
  const prop = ctx.customStyleStore.getCSSCustomProperty(input.name);
  if (!prop) throw new Error(`CSS custom property "${input.name}" not found`);
  return prop;
}
