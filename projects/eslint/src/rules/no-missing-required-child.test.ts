import rule from './no-missing-required-child.js';
import { ruleTester, webqOption } from './test-utils.js';

ruleTester.run('no-missing-required-child', rule, {
  valid: [
    // alert with required header slot present
    { code: '<my-alert><span slot="header">Title</span></my-alert>', options: [webqOption] },
    // non-pattern element (no pattern defines my-button as root with children)
    { code: '<my-button>Click</my-button>', options: [webqOption] },
    // standard HTML element
    { code: '<div></div>', options: [webqOption] }
  ],
  invalid: [
    // alert missing required header slot child
    {
      code: '<my-alert><span>Content only</span></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'missingRequiredChild' }]
    }
  ]
});
