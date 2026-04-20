import { z as zod } from 'zod/v3';
import { formatElement } from '../../../cli/format.js';
import type { ToolContext } from '../../tools.js';
import type { ElementOutput } from './tools.js';
import { getElementOrThrow, buildElementOutput } from './tools.js';

const tagNameSchema = zod.object({
  tagName: zod.string().describe("The tag name of the custom element (e.g. 'my-button')")
});

export const metadata = {
  command: 'element <tag-name>',
  toolName: 'element_get',
  summary: 'Get details for a custom element',
  description:
    'Get details for a custom element including attributes, properties, methods, events, slots, commands, CSS properties, and CSS parts.',
  annotations: {
    readOnlyHint: true as const,
    destructiveHint: false as const,
    openWorldHint: false as const
  },
  inputSchema: tagNameSchema
};

export function toMarkdown(ctx: ToolContext, input: { tagName: string }): string {
  return formatElement(getElementOrThrow(ctx, input.tagName));
}

export function toJSON(ctx: ToolContext, input: { tagName: string }): ElementOutput {
  return buildElementOutput(ctx, input.tagName);
}
