import rule from './no-unknown-event.js';
import { ruleTester, webqOption, webqPath } from './test-utils.js';

ruleTester.run('no-unknown-event', rule, {
  valid: [
    // on* syntax
    { code: '<my-alert onclose="handler()"></my-alert>', options: [webqOption] },
    { code: '<my-button onclick="handler()"></my-button>', options: [webqOption] },
    // @event syntax (Lit)
    { code: '<my-alert @close="handler()"></my-alert>', options: [webqOption] },
    { code: '<my-button @click="handler()"></my-button>', options: [webqOption] },
    // on-event syntax
    { code: '<my-alert on-close="handler()"></my-alert>', options: [webqOption] },
    { code: '<my-button on-click="handler()"></my-button>', options: [webqOption] },
    // (event) syntax (Angular)
    { code: '<my-alert (close)="handler()"></my-alert>', options: [webqOption] },
    { code: '<my-button (click)="handler()"></my-button>', options: [webqOption] },
    // non-custom elements are ignored
    { code: '<div onclick="handler()"></div>', options: [webqOption] },
    // unknown custom element — not in CEM, skip
    { code: '<my-unknown @foo="handler()"></my-unknown>', options: [webqOption] },
    // non-event attributes are ignored
    { code: '<my-alert status="warning"></my-alert>', options: [webqOption] },
    // on* with non-native events — not in the native event handlers whitelist, so not recognized as event bindings
    { code: '<my-alert onopen="handler()"></my-alert>', options: [webqOption] },
    { code: '<my-alert onClose="handler()"></my-alert>', options: [webqOption] },
    // additional events option
    {
      code: '<my-alert @custom-event="handler()"></my-alert>',
      options: [{ path: webqPath, events: ['custom-event'] }]
    }
  ],
  invalid: [
    // @event syntax — unknown event
    {
      code: '<my-alert @open="handler()"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'unknownEvent' }]
    },
    // on-event syntax — unknown event
    {
      code: '<my-alert on-open="handler()"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'unknownEvent' }]
    },
    // (event) syntax — unknown event
    {
      code: '<my-alert (open)="handler()"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'unknownEvent' }]
    },
    // case sensitive — Close !== close
    {
      code: '<my-alert @Close="handler()"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'unknownEvent' }]
    },
    // additional events don't cover this one
    {
      code: '<my-alert @unknown="handler()"></my-alert>',
      options: [{ path: webqPath, events: ['other-event'] }],
      errors: [{ messageId: 'unknownEvent' }]
    }
  ]
});
