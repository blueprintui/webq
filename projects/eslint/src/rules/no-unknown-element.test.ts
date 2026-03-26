import rule from './no-unknown-element.js';
import { ruleTester, webqOption, webqPath } from './test-utils.js';

ruleTester.run('no-unknown-element', rule, {
  valid: [
    // known elements from CEM
    { code: '<my-alert></my-alert>', options: [webqOption] },
    { code: '<my-button></my-button>', options: [webqOption] },
    { code: '<my-old-card></my-old-card>', options: [webqOption] },
    // standard HTML elements (no dash, not checked)
    { code: '<div></div>', options: [webqOption] },
    { code: '<span></span>', options: [webqOption] },
    // additional tags option
    {
      code: '<third-party-element></third-party-element>',
      options: [{ path: webqPath, tags: ['third-party-element'] }]
    },
    {
      code: '<x-widget></x-widget>',
      options: [{ path: webqPath, tags: ['x-widget', 'x-other'] }]
    }
  ],
  invalid: [
    {
      code: '<my-unknown></my-unknown>',
      options: [webqOption],
      errors: [{ messageId: 'unknownElement' }]
    },
    {
      code: '<foo-bar></foo-bar>',
      options: [webqOption],
      errors: [{ messageId: 'unknownElement' }]
    },
    // additional tags don't cover this one
    {
      code: '<not-listed></not-listed>',
      options: [{ path: webqPath, tags: ['other-element'] }],
      errors: [{ messageId: 'unknownElement' }]
    }
  ]
});
