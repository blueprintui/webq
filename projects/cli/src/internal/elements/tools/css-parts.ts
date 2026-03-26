import z from 'zod/v3';
import { formatCSSPartsValue } from '../../../cli/format.js';
import type { ToolContext } from '../../tools.js';
import type { CSSPartsOutput } from './tools.js';
import { getElementOrThrow } from './tools.js';

const tagNameSchema = z.object({
  tagName: z.string().describe("The tag name of the custom element (e.g. 'my-button')")
});

export const metadata = {
  command: 'element.css-parts <tag-name>',
  toolName: 'element_get_css_parts',
  summary: 'Get CSS parts for a custom element',
  description: 'Get CSS parts exposed by a custom element for styling via ::part() selector.',
  annotations: {
    readOnlyHint: true as const,
    destructiveHint: false as const,
    openWorldHint: false as const
  },
  inputSchema: tagNameSchema
};

export function toMarkdown(ctx: ToolContext, input: { tagName: string }) {
  const element = getElementOrThrow(ctx, input.tagName);
  return formatCSSPartsValue(element.cssParts ?? [], input.tagName);
}

export function toJSON(ctx: ToolContext, input: { tagName: string }): CSSPartsOutput {
  const element = getElementOrThrow(ctx, input.tagName);
  return {
    tagName: input.tagName,
    cssParts: (element.cssParts ?? []).map(p => ({
      name: p.name,
      description: p.description,
      deprecated: p.deprecated
    }))
  };
}
