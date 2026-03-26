import rule from './no-unknown-slot.js';
import { ruleTester, webqOption } from './test-utils.js';

ruleTester.run('no-unknown-slot', rule, {
  valid: [
    { code: '<my-alert><span slot="header">Title</span></my-alert>', options: [webqOption] },
    { code: '<my-alert><span slot="actions">OK</span></my-alert>', options: [webqOption] },
    { code: '<my-alert><span>Default content</span></my-alert>', options: [webqOption] },
    { code: '<div><span slot="anything">OK</span></div>', options: [webqOption] },
    { code: '<my-unknown-element><span slot="foo">OK</span></my-unknown-element>', options: [webqOption] }
  ],
  invalid: [
    {
      code: '<my-alert><span slot="footer">Nope</span></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'unknownSlot' }]
    },
    {
      code: '<my-alert><span slot="sidebar">Nope</span></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'unknownSlot' }]
    },
    {
      code: '<my-button><span slot="icon">X</span></my-button>',
      options: [webqOption],
      errors: [{ messageId: 'unknownSlot' }]
    }
  ]
});
