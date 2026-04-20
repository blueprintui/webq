import { z as zod } from 'zod/v3';
import { formatPattern } from '../../../cli/format.js';
import type { ToolContext } from '../../tools.js';
import type { Pattern } from '../types.js';

export const metadata = {
  command: 'pattern <name>',
  toolName: 'pattern_get',
  summary: 'Get details for a pattern',
  description: 'Get full details for a compositional pattern including structural rules and HTML examples.',
  annotations: {
    readOnlyHint: true as const,
    destructiveHint: false as const,
    openWorldHint: false as const
  },
  inputSchema: zod.object({
    name: zod.string().describe('The name of the pattern')
  })
};

export function toMarkdown(ctx: ToolContext, input: { name: string }): string {
  if (!ctx.patternStore) throw new Error('No patterns file loaded');
  const pattern = ctx.patternStore.getPattern(input.name);
  if (!pattern) throw new Error(`Pattern "${input.name}" not found`);
  return formatPattern(pattern);
}

export function toJSON(ctx: ToolContext, input: { name: string }): Pattern {
  if (!ctx.patternStore) throw new Error('No patterns file loaded');
  const pattern = ctx.patternStore.getPattern(input.name);
  if (!pattern) throw new Error(`Pattern "${input.name}" not found`);
  return pattern;
}
