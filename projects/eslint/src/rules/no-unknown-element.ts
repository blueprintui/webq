import type { Rule } from 'eslint';
import { runWebqValidation } from '../utils/webq.js';

const RULE_ID = 'no-unknown-element';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow custom elements not defined in the Custom Elements Manifest'
    },
    schema: [
      {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Directory path to the webq manifest files'
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Additional custom element tag names to allow'
          }
        },
        required: ['path'],
        additionalProperties: false
      }
    ],
    messages: {
      unknownElement: '{{webqMessage}}'
    }
  },

  create(context) {
    const options = context.options[0] as { path: string; tags?: string[] } | undefined;
    if (!options?.path) return {};
    const path = options.path;

    const additionalTags = new Set(options.tags ?? []);

    function checkDocument() {
      const html = context.sourceCode.getText();
      const messages = runWebqValidation(html, path);

      for (const msg of messages) {
        if (msg.ruleId !== RULE_ID) continue;

        // Post-filter: skip tags in the allowlist
        if (additionalTags.size > 0) {
          const tagMatch = msg.message.match(/Unknown custom element <(.+?)>/);
          if (tagMatch && additionalTags.has(tagMatch[1])) continue;
        }

        context.report({
          loc: { start: { line: msg.line, column: msg.column - 1 }, end: { line: msg.line, column: msg.column } },
          messageId: 'unknownElement',
          data: { webqMessage: msg.message }
        });
      }
    }

    return { Document: checkDocument } as unknown as Rule.RuleListener;
  }
};

export default rule;
