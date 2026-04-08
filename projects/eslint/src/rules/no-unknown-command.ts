import type { Rule } from 'eslint';
import { webqOptionSchema } from '../utils/schema.js';
import { runWebqValidation } from '../utils/webq.js';

const RULE_ID = 'no-unknown-command';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow invoker commands not defined in the target Custom Element Manifest'
    },
    schema: webqOptionSchema,
    messages: {
      unknownCommand: '{{webqMessage}}'
    }
  },

  create(context) {
    const options = context.options[0] as { path: string } | undefined;
    if (!options?.path) return {};
    const path = options.path;

    function checkDocument() {
      const html = context.sourceCode.getText();
      const messages = runWebqValidation(html, path);

      for (const msg of messages) {
        if (msg.ruleId !== RULE_ID) continue;
        context.report({
          loc: {
            start: { line: msg.line, column: msg.column - 1 },
            end: { line: msg.endLine ?? msg.line, column: (msg.endColumn ?? msg.column + 1) - 1 }
          },
          messageId: 'unknownCommand',
          data: { webqMessage: msg.message }
        });
      }
    }

    return { Document: checkDocument } as unknown as Rule.RuleListener;
  }
};

export default rule;
