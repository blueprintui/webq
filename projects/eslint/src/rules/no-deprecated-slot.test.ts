import rule from './no-deprecated-slot.js';
import { ruleTester, webqOption } from './test-utils.js';

ruleTester.run('no-deprecated-slot', rule, {
  valid: [
    // non-deprecated slots
    { code: '<my-alert><span slot="header">Title</span></my-alert>', options: [webqOption] },
    { code: '<my-alert><span slot="actions">OK</span></my-alert>', options: [webqOption] },
    // no slot attr
    { code: '<my-alert><span>Content</span></my-alert>', options: [webqOption] },
    // non-custom element parent
    { code: '<div><span slot="icon">X</span></div>', options: [webqOption] },
    // unknown custom element parent
    { code: '<my-unknown><span slot="icon">X</span></my-unknown>', options: [webqOption] }
  ],
  invalid: [
    {
      code: '<my-alert><span slot="icon">X</span></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'deprecatedSlot', line: 1, column: 17, endLine: 1, endColumn: 18 }]
    }
  ]
});
