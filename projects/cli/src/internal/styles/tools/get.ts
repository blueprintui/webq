import { z as zod } from 'zod/v3';
import { formatCSSCustomPropertyDetail } from '../../../cli/format.js';
import type { ToolContext } from '../../tools.js';
import type { CSSCustomProperty } from '../types.js';

export const metadata = {
  command: 'style.property <name>',
  toolName: 'style_property_get',
  summary: 'Get a CSS custom property',
  description: 'Get full details for a CSS custom property from custom styles.',
  annotations: {
    readOnlyHint: true as const,
    destructiveHint: false as const,
    openWorldHint: false as const
  },
  inputSchema: zod.object({
    name: zod.string().describe('The name of the CSS custom property')
  })
};

const errNoStyleSources = 'No CSS custom properties found (no custom-styles.json or DTCG tokens.json)';

export function toMarkdown(ctx: ToolContext, input: { name: string }): string {
  if (!ctx.customStyleStore) throw new Error(errNoStyleSources);
  const prop = ctx.customStyleStore.getCSSCustomProperty(input.name);
  if (!prop) throw new Error(`CSS custom property "${input.name}" not found`);
  return formatCSSCustomPropertyDetail(prop);
}

export function toJSON(ctx: ToolContext, input: { name: string }): CSSCustomProperty {
  if (!ctx.customStyleStore) throw new Error(errNoStyleSources);
  const prop = ctx.customStyleStore.getCSSCustomProperty(input.name);
  if (!prop) throw new Error(`CSS custom property "${input.name}" not found`);
  return prop;
}
