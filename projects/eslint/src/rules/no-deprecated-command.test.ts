import rule from './no-deprecated-command.js';
import { ruleTester, webqOption } from './test-utils.js';

ruleTester.run('no-deprecated-command', rule, {
  valid: [
    // non-deprecated command
    {
      code: '<button command="--close" commandfor="a1">Close</button><my-alert id="a1"></my-alert>',
      options: [webqOption]
    },
    // no commandfor — skip
    {
      code: '<button command="--dismiss">Dismiss</button>',
      options: [webqOption]
    },
    // target is not a custom element — skip
    {
      code: '<button command="--dismiss" commandfor="d1">Dismiss</button><div id="d1"></div>',
      options: [webqOption]
    },
    // target not in CEM — skip
    {
      code: '<button command="--dismiss" commandfor="u1">Dismiss</button><my-unknown id="u1"></my-unknown>',
      options: [webqOption]
    }
  ],
  invalid: [
    {
      code: '<button command="--dismiss" commandfor="a1">Dismiss</button><my-alert id="a1"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'deprecatedCommand', line: 1, column: 9, endLine: 1, endColumn: 10 }]
    }
  ]
});
