import z from 'zod/v3';
import type { ToolContext } from '../../tools.js';
import type { Rule } from '../types.js';
import { verify, allRules, getRule } from '../validate.js';

export const metadata = {
  command: 'validate-html <html>',
  toolName: 'validate_html',
  summary: 'Validate HTML against manifest',
  description: 'Validate an HTML string against the Custom Elements Manifest. Returns ESLint-compatible lint results.',
  annotations: {
    readOnlyHint: true as const,
    destructiveHint: false as const,
    openWorldHint: false as const
  },
  inputSchema: z.object({
    html: z.string().describe('The HTML string to validate'),
    rule: z.string().optional().describe('Run a specific rule')
  })
};

export function toMarkdown(_ctx: ToolContext, _input: { html: string; rule?: string }): string {
  // validate-html always outputs JSON/lint format, not markdown
  throw new Error('validate-html does not support markdown output');
}

export function toJSON(ctx: ToolContext, input: { html: string; rule?: string }) {
  let rules: Rule[];
  if (input.rule) {
    const r = getRule(input.rule);
    if (!r) throw new Error(`unknown rule "${input.rule}"`);
    rules = [r];
  } else {
    rules = allRules();
  }
  return verify(input.html, ctx.store, rules, ctx.validateCfg, {
    patternStore: ctx.patternStore,
    customStyleStore: ctx.customStyleStore,
    customAttributeStore: ctx.customAttrStore
  });
}
