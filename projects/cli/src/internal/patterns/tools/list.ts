import z from 'zod/v3';
import { formatPatternSummaries } from '../../../cli/format.js';
import type { ToolContext } from '../../tools.js';

export const metadata = {
  command: 'pattern.list',
  toolName: 'pattern_get_list',
  summary: 'List all compositional patterns',
  description: 'List all compositional patterns.',
  annotations: {
    readOnlyHint: true as const,
    destructiveHint: false as const,
    openWorldHint: false as const
  },
  inputSchema: z.object({})
};

export function toMarkdown(ctx: ToolContext) {
  if (!ctx.patternStore) return 'No custom-patterns.json found\n';
  return formatPatternSummaries(ctx.patternStore.getPatterns());
}

export function toJSON(ctx: ToolContext) {
  if (!ctx.patternStore) return { patterns: [] };
  const summaries = ctx.patternStore.getPatterns();
  return {
    patterns: summaries.map(s => ({
      name: s.name,
      description: s.description,
      tags: s.tags
    }))
  };
}
