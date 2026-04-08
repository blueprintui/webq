import rule from './no-deprecated-attr.js';
import { ruleTester, webqOption } from './test-utils.js';

ruleTester.run('no-deprecated-attr', rule, {
  valid: [
    { code: '<my-alert status="warning"></my-alert>', options: [webqOption] },
    { code: '<my-alert closable></my-alert>', options: [webqOption] },
    { code: '<my-button disabled></my-button>', options: [webqOption] },
    { code: '<div type="text"></div>', options: [webqOption] }
  ],
  invalid: [
    {
      code: '<my-alert type="info"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'deprecatedAttr', line: 1, column: 11, endLine: 1, endColumn: 12 }]
    }
  ]
});
