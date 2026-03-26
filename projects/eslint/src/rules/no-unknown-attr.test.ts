import rule from './no-unknown-attr.js';
import { ruleTester, webqOption } from './test-utils.js';

ruleTester.run('no-unknown-attr', rule, {
  valid: [
    { code: '<my-alert status="warning"></my-alert>', options: [webqOption] },
    { code: '<my-alert closable></my-alert>', options: [webqOption] },
    { code: '<my-alert status="warning" closable></my-alert>', options: [webqOption] },
    { code: '<my-alert class="foo" id="bar"></my-alert>', options: [webqOption] },
    { code: '<my-alert data-testid="test"></my-alert>', options: [webqOption] },
    { code: '<my-alert aria-label="alert"></my-alert>', options: [webqOption] },
    { code: '<my-alert hidden></my-alert>', options: [webqOption] },
    { code: '<my-alert slot="content"></my-alert>', options: [webqOption] },
    { code: '<div unknown-attr></div>', options: [webqOption] },
    { code: '<my-unknown-element foo="bar"></my-unknown-element>', options: [webqOption] }
  ],
  invalid: [
    {
      code: '<my-alert severity="warning"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'unknownAttr' }]
    },
    {
      code: '<my-alert foo="bar"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'unknownAttr' }]
    },
    {
      code: '<my-button variant="primary"></my-button>',
      options: [webqOption],
      errors: [{ messageId: 'unknownAttr' }]
    },
    {
      code: '<my-alert foo="1" bar="2"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'unknownAttr' }, { messageId: 'unknownAttr' }]
    }
  ]
});
