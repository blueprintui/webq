import rule from './no-deprecated-element.js';
import { ruleTester, webqOption } from './test-utils.js';

ruleTester.run('no-deprecated-element', rule, {
  valid: [
    { code: '<my-alert status="warning"></my-alert>', options: [webqOption] },
    { code: '<my-button disabled></my-button>', options: [webqOption] },
    { code: '<div>Regular HTML</div>', options: [webqOption] }
  ],
  invalid: [
    {
      code: '<my-old-card heading="Hello"></my-old-card>',
      options: [webqOption],
      errors: [{ messageId: 'deprecatedElement', line: 1, column: 1, endLine: 1, endColumn: 43 }]
    }
  ]
});
