import type { Rule } from 'eslint';
import { runWebqValidation } from '../utils/webq.js';

const RULE_ID = 'no-unknown-event';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow event bindings not defined in the Custom Elements Manifest'
    },
    schema: [
      {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Directory path to the webq manifest files'
          },
          events: {
            type: 'array',
            items: { type: 'string' },
            description: 'Additional event names to allow on any custom element'
          }
        },
        required: ['path'],
        additionalProperties: false
      }
    ],
    messages: {
      unknownEvent: '{{webqMessage}}'
    }
  },

  create(context) {
    const options = context.options[0] as { path: string; events?: string[] } | undefined;
    if (!options?.path) return {};

    const additionalEvents = new Set(options.events ?? []);

    function checkDocument() {
      const html = context.sourceCode.getText();
      const messages = runWebqValidation(html, options!.path);

      for (const msg of messages) {
        if (msg.ruleId !== RULE_ID) continue;

        // Post-filter: skip events in the allowlist
        if (additionalEvents.size > 0) {
          const eventMatch = msg.message.match(/Unknown event "(.+?)"/);
          if (eventMatch && additionalEvents.has(eventMatch[1])) continue;
        }

        context.report({
          loc: { start: { line: msg.line, column: msg.column - 1 }, end: { line: msg.line, column: msg.column } },
          messageId: 'unknownEvent',
          data: { webqMessage: msg.message }
        });
      }
    }

    return { Document: checkDocument } as unknown as Rule.RuleListener;
  }
};

export default rule;
