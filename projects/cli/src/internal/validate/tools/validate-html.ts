import zod from 'zod/v3';
import type { ToolContext } from '../../tools.js';
import type { Rule, LintResult } from '../types.js';
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
  inputSchema: zod.object({
    html: zod.string().describe('The HTML string to validate'),
    rule: zod.string().optional().describe('Run a specific rule')
  })
};

export function toMarkdown(_ctx: ToolContext, _input: { html: string; rule?: string }): string {
  // validate-html always outputs JSON/lint format, not markdown
  throw new Error('validate-html does not support markdown output');
}

export function toJSON(ctx: ToolContext, input: { html: string; rule?: string }): LintResult {
  let rules: Rule[];
  if (input.rule) {
    const result = getRule(input.rule);
    if (!result) throw new Error(`unknown rule "${input.rule}"`);
    rules = [result];
  } else {
    rules = allRules();
  }
  return verify(input.html, ctx.store, rules, {
    cfg: ctx.validateCfg,
    stores: {
      patternStore: ctx.patternStore,
      customStyleStore: ctx.customStyleStore,
      customAttributeStore: ctx.customAttrStore
    }
  });
}
