import type { Rule } from 'eslint';

export const webqOptionSchema: Rule.RuleMetaData['schema'] = [
  {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Directory path to the webq manifest files'
      }
    },
    required: ['path'],
    additionalProperties: false
  }
];
