import rule from './no-unknown-command.js';
import { ruleTester, webqOption } from './test-utils.js';

ruleTester.run('no-unknown-command', rule, {
  valid: [
    // valid command targeting a custom element by id
    {
      code: '<button command="--close" commandfor="my-alert-1">Close</button><my-alert id="my-alert-1"></my-alert>',
      options: [webqOption]
    },
    // commandfor before target in DOM (rule collects all ids first)
    {
      code: '<my-alert id="a1"></my-alert><button command="--close" commandfor="a1">Close</button>',
      options: [webqOption]
    },
    // no commandfor — not an invoker pattern, skip
    {
      code: '<button command="--close">Close</button>',
      options: [webqOption]
    },
    // no command attr — skip
    {
      code: '<button commandfor="a1">Close</button><my-alert id="a1"></my-alert>',
      options: [webqOption]
    },
    // target is not a custom element — skip
    {
      code: '<button command="--toggle" commandfor="d1">Toggle</button><div id="d1"></div>',
      options: [webqOption]
    },
    // target is a custom element not in CEM — skip
    {
      code: '<button command="--foo" commandfor="u1">Foo</button><my-unknown id="u1"></my-unknown>',
      options: [webqOption]
    }
  ],
  invalid: [
    // unknown command on a known custom element
    {
      code: '<button command="--open" commandfor="a1">Open</button><my-alert id="a1"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'unknownCommand' }]
    },
    {
      code: '<button command="--toggle" commandfor="a1">Toggle</button><my-alert id="a1"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'unknownCommand' }]
    },
    // element with no commands defined
    {
      code: '<button command="--click" commandfor="b1">Click</button><my-button id="b1"></my-button>',
      options: [webqOption],
      errors: [{ messageId: 'unknownCommand' }]
    }
  ]
});
