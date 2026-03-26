import rule from './no-boolean-attr-value.js';
import { ruleTester, webqOption } from './test-utils.js';

ruleTester.run('no-boolean-attr-value', rule, {
  valid: [
    // boolean attr without value — correct usage
    { code: '<my-alert closable></my-alert>', options: [webqOption] },
    { code: '<my-button disabled></my-button>', options: [webqOption] },
    // non-boolean attrs with values — fine
    { code: '<my-alert status="warning"></my-alert>', options: [webqOption] },
    { code: '<my-button action="primary"></my-button>', options: [webqOption] },
    // non-custom element
    { code: '<input disabled="true">', options: [webqOption] },
    // unknown custom element
    { code: '<my-unknown disabled="true"></my-unknown>', options: [webqOption] }
  ],
  invalid: [
    {
      code: '<my-alert closable="true"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'booleanAttrValue' }]
    },
    {
      code: '<my-alert closable="false"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'booleanAttrValue' }]
    },
    {
      code: '<my-button disabled="true"></my-button>',
      options: [webqOption],
      errors: [{ messageId: 'booleanAttrValue' }]
    },
    {
      code: '<my-button disabled="disabled"></my-button>',
      options: [webqOption],
      errors: [{ messageId: 'booleanAttrValue' }]
    }
  ]
});
