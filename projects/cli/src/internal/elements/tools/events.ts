import z from 'zod/v3';
import { formatEventsValue } from '../../../cli/format.js';
import type { ToolContext } from '../../tools.js';
import type { EventsOutput } from './tools.js';
import { getElementOrThrow, toTypeInfo } from './tools.js';

const tagNameSchema = z.object({
  tagName: z.string().describe("The tag name of the custom element (e.g. 'my-button')")
});

export const metadata = {
  command: 'element.events <tag-name>',
  toolName: 'element_get_events',
  summary: 'Get events for a custom element',
  description: 'Get events that a custom element can fire.',
  annotations: {
    readOnlyHint: true as const,
    destructiveHint: false as const,
    openWorldHint: false as const
  },
  inputSchema: tagNameSchema
};

export function toMarkdown(ctx: ToolContext, input: { tagName: string }) {
  const element = getElementOrThrow(ctx, input.tagName);
  return formatEventsValue(element.events ?? [], input.tagName);
}

export function toJSON(ctx: ToolContext, input: { tagName: string }): EventsOutput {
  const element = getElementOrThrow(ctx, input.tagName);
  return {
    tagName: input.tagName,
    events: (element.events ?? []).map(e => ({
      name: e.name,
      description: e.description,
      type: toTypeInfo(e.type),
      deprecated: e.deprecated
    }))
  };
}
