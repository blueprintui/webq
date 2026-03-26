import rule from './no-deprecated-event.js';
import { ruleTester, webqOption } from './test-utils.js';

ruleTester.run('no-deprecated-event', rule, {
  valid: [
    // non-deprecated events
    { code: '<my-alert onclose="handler()"></my-alert>', options: [webqOption] },
    { code: '<my-alert @close="handler()"></my-alert>', options: [webqOption] },
    { code: '<my-alert (close)="handler()"></my-alert>', options: [webqOption] },
    { code: '<my-alert on-close="handler()"></my-alert>', options: [webqOption] },
    // non-custom element
    { code: '<div ondismiss="handler()"></div>', options: [webqOption] },
    // unknown custom element
    { code: '<my-unknown @dismiss="handler()"></my-unknown>', options: [webqOption] },
    // non-event attribute
    { code: '<my-alert status="warning"></my-alert>', options: [webqOption] },
    // on* with non-native events — not in the native event handlers whitelist, so not recognized as event bindings
    { code: '<my-alert ondismiss="handler()"></my-alert>', options: [webqOption] }
  ],
  invalid: [
    // @event syntax
    {
      code: '<my-alert @dismiss="handler()"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'deprecatedEvent' }]
    },
    // (event) syntax
    {
      code: '<my-alert (dismiss)="handler()"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'deprecatedEvent' }]
    },
    // on-event syntax
    {
      code: '<my-alert on-dismiss="handler()"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'deprecatedEvent' }]
    }
  ]
});
