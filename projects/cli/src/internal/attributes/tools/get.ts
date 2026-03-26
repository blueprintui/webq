import z from 'zod/v3';
import { formatCustomAttribute } from '../../../cli/format.js';
import type { ToolContext } from '../../tools.js';

export const metadata = {
  command: 'attribute <name>',
  toolName: 'attribute_get',
  summary: 'Get details for a custom attribute',
  description: 'Get full details for a custom attribute including token groups, values, and HTML examples.',
  annotations: {
    readOnlyHint: true as const,
    destructiveHint: false as const,
    openWorldHint: false as const
  },
  inputSchema: z.object({
    name: z.string().describe('The name of the custom attribute')
  })
};

export function toMarkdown(ctx: ToolContext, input: { name: string }) {
  if (!ctx.customAttrStore) throw new Error('No custom attributes file loaded');
  const attr = ctx.customAttrStore.getCustomAttribute(input.name);
  if (!attr) throw new Error(`Custom attribute "${input.name}" not found`);
  return formatCustomAttribute(attr);
}

export function toJSON(ctx: ToolContext, input: { name: string }) {
  if (!ctx.customAttrStore) throw new Error('No custom attributes file loaded');
  const attr = ctx.customAttrStore.getCustomAttribute(input.name);
  if (!attr) throw new Error(`Custom attribute "${input.name}" not found`);
  return attr;
}
