import { z as zod } from 'zod/v3';
import { formatMethodsValue } from '../../../cli/format.js';
import type { ToolContext } from '../../tools.js';
import { KindMethod } from '../types.js';
import type { MethodInfo, MethodsOutput } from './tools.js';
import { getElementOrThrow, toReturnInfo, toParameterInfo } from './tools.js';

const tagNameSchema = zod.object({
  tagName: zod.string().describe("The tag name of the custom element (e.g. 'my-button')")
});

export const metadata = {
  command: 'element.methods <tag-name>',
  toolName: 'element_get_methods',
  summary: 'Get methods for a custom element',
  description: 'Get methods for a custom element.',
  annotations: {
    readOnlyHint: true as const,
    destructiveHint: false as const,
    openWorldHint: false as const
  },
  inputSchema: tagNameSchema
};

export function toMarkdown(ctx: ToolContext, input: { tagName: string }): string {
  const element = getElementOrThrow(ctx, input.tagName);
  const methods = (element.members ?? []).filter(member => member.kind === KindMethod);
  return formatMethodsValue(methods, input.tagName);
}

export function toJSON(ctx: ToolContext, input: { tagName: string }): MethodsOutput {
  const element = getElementOrThrow(ctx, input.tagName);
  const methods = (element.members ?? []).filter(member => member.kind === KindMethod);
  return {
    tagName: input.tagName,
    methods: methods.map(method => {
      const info: MethodInfo = {
        name: method.name,
        description: method.description,
        privacy: method.privacy,
        return: toReturnInfo(method.return)
      };
      if (method.parameters) info.parameters = method.parameters.map(toParameterInfo);
      return info;
    })
  };
}
