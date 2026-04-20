import { z as zod } from 'zod/v3';
import { formatElementSummaries } from '../../../cli/format.js';
import type { ToolContext } from '../../tools.js';
import type { ElementsOutput } from './tools.js';

export const metadata = {
  command: 'element.list',
  toolName: 'element_get_list',
  summary: 'List all custom elements',
  description:
    'List all custom elements with their tag names. Use this first to discover available components before querying specific elements.',
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false
  },
  inputSchema: zod.object({})
};

export function toMarkdown(ctx: ToolContext): string {
  return formatElementSummaries(ctx.store.getElementSummaries());
}

export function toJSON(ctx: ToolContext): ElementsOutput {
  return {
    elements: ctx.store.getElementSummaries().map(summary => ({
      tagName: summary.tagName,
      description: summary.description
    }))
  };
}
