import { z as zod } from 'zod/v3';
import { formatCommandsValue } from '../../../cli/format.js';
import type { ToolContext } from '../../tools.js';
import type { CommandsOutput } from './tools.js';
import { getElementOrThrow } from './tools.js';

const tagNameSchema = zod.object({
  tagName: zod.string().describe("The tag name of the custom element (e.g. 'my-button')")
});

export const metadata = {
  command: 'element.commands <tag-name>',
  toolName: 'element_get_commands',
  summary: 'Get commands for a custom element',
  description: 'Get invoker commands for a custom element.',
  annotations: {
    readOnlyHint: true as const,
    destructiveHint: false as const,
    openWorldHint: false as const
  },
  inputSchema: tagNameSchema
};

export function toMarkdown(ctx: ToolContext, input: { tagName: string }): string {
  const element = getElementOrThrow(ctx, input.tagName);
  return formatCommandsValue(element.commands ?? [], input.tagName);
}

export function toJSON(ctx: ToolContext, input: { tagName: string }): CommandsOutput {
  const element = getElementOrThrow(ctx, input.tagName);
  return {
    tagName: input.tagName,
    commands: (element.commands ?? []).map(command => ({
      name: command.name,
      description: command.description,
      deprecated: command.deprecated
    }))
  };
}
