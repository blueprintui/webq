import rule from './no-missing-sibling-binding.js';
import { ruleTester, webqOption } from './test-utils.js';

ruleTester.run('no-missing-sibling-binding', rule, {
  valid: [
    // valid: trigger with matching target
    {
      code: '<my-button commandfor="my-alert">Toggle</my-button><my-alert id="my-alert"></my-alert>',
      options: [webqOption]
    },
    // not a trigger (no commandfor attr) — rule should not engage
    { code: '<my-button>Click</my-button>', options: [webqOption] },
    // standard HTML element
    { code: '<div></div>', options: [webqOption] }
  ],
  invalid: [
    // trigger without matching sibling target
    {
      code: '<my-button commandfor="my-alert">Toggle</my-button>',
      options: [webqOption],
      errors: [{ messageId: 'missingSiblingBinding' }]
    },
    // trigger with mismatched binding values
    {
      code: '<my-button commandfor="alert-a">Toggle</my-button><my-alert id="alert-b"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'missingSiblingBinding' }]
    }
  ]
});
