import rule from './no-unknown-attr-value.js';
import { ruleTester, webqOption } from './test-utils.js';

ruleTester.run('no-unknown-attr-value', rule, {
  valid: [
    { code: '<my-alert status="success"></my-alert>', options: [webqOption] },
    { code: '<my-alert status="warning"></my-alert>', options: [webqOption] },
    { code: '<my-alert status="danger"></my-alert>', options: [webqOption] },
    { code: '<my-button action="primary"></my-button>', options: [webqOption] },
    { code: '<my-button action="secondary"></my-button>', options: [webqOption] },
    { code: '<my-button action="flat"></my-button>', options: [webqOption] },
    // string type — no constrained values, anything goes
    { code: '<my-old-card heading="anything"></my-old-card>', options: [webqOption] },
    // boolean attr without value
    { code: '<my-alert closable></my-alert>', options: [webqOption] },
    // non-custom elements are ignored
    { code: '<div class="foo"></div>', options: [webqOption] },
    // unknown custom element — not in CEM, skip
    { code: '<my-unknown status="foo"></my-unknown>', options: [webqOption] }
  ],
  invalid: [
    {
      code: '<my-alert status="info"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'invalidValue' }]
    },
    {
      code: '<my-alert status="error"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'invalidValue' }]
    },
    {
      code: '<my-button action="tertiary"></my-button>',
      options: [webqOption],
      errors: [{ messageId: 'invalidValue' }]
    },
    {
      code: '<my-alert status="info" closable></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'invalidValue' }]
    }
  ]
});
