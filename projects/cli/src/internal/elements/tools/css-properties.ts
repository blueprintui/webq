import { z as zod } from 'zod/v3';
import { formatCSSPropertiesValue } from '../../../cli/format.js';
import type { ToolContext } from '../../tools.js';
import type { CSSPropertiesOutput } from './tools.js';
import { getElementOrThrow } from './tools.js';

const tagNameSchema = zod.object({
  tagName: zod.string().describe("The tag name of the custom element (e.g. 'my-button')")
});

export const metadata = {
  command: 'element.css-properties <tag-name>',
  toolName: 'element_get_css_properties',
  summary: 'Get CSS properties for a custom element',
  description: 'Get CSS custom properties (CSS variables) for a custom element.',
  annotations: {
    readOnlyHint: true as const,
    destructiveHint: false as const,
    openWorldHint: false as const
  },
  inputSchema: tagNameSchema
};

export function toMarkdown(ctx: ToolContext, input: { tagName: string }): string {
  const element = getElementOrThrow(ctx, input.tagName);
  return formatCSSPropertiesValue(element.cssProperties ?? [], input.tagName);
}

export function toJSON(ctx: ToolContext, input: { tagName: string }): CSSPropertiesOutput {
  const element = getElementOrThrow(ctx, input.tagName);
  return {
    tagName: input.tagName,
    cssProperties: (element.cssProperties ?? []).map(prop => ({
      name: prop.name,
      description: prop.description,
      default: prop.default,
      deprecated: prop.deprecated
    }))
  };
}
