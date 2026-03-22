import z from 'zod/v3';
import { formatSlotsValue } from '../../../cli/format.js';
import type { ToolContext } from '../../tools.js';
import type { SlotsOutput } from './tools.js';
import { getElementOrThrow } from './tools.js';

const tagNameSchema = z.object({
  tagName: z.string().describe("The tag name of the custom element (e.g. 'my-button')")
});

export const metadata = {
  command: 'element.slots <tag-name>',
  toolName: 'element_get_slots',
  summary: 'Get slots for a custom element',
  description: "Get slots available in a custom element's shadow DOM.",
  annotations: {
    readOnlyHint: true as const,
    destructiveHint: false as const,
    openWorldHint: false as const
  },
  inputSchema: tagNameSchema
};

export function toMarkdown(ctx: ToolContext, input: { tagName: string }) {
  const element = getElementOrThrow(ctx, input.tagName);
  return formatSlotsValue(element.slots ?? [], input.tagName);
}

export function toJSON(ctx: ToolContext, input: { tagName: string }): SlotsOutput {
  const element = getElementOrThrow(ctx, input.tagName);
  return {
    tagName: input.tagName,
    slots: (element.slots ?? []).map(s => ({
      name: s.name,
      description: s.description,
      deprecated: s.deprecated
    }))
  };
}
