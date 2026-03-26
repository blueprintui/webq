import rule from './no-unknown-custom-attr-value.js';
import { ruleTester, webqOption } from './test-utils.js';

ruleTester.run('no-unknown-custom-attr-value', rule, {
  valid: [
    // valid token-list value
    {
      code: '<div bp-layout="grid gap:md"></div>',
      options: [webqOption]
    },
    // valid enum value
    {
      code: '<div bp-theme="dark"></div>',
      options: [webqOption]
    },
    // attribute not in custom-attributes — skip
    {
      code: '<div unknown-thing="whatever"></div>',
      options: [webqOption]
    }
  ],
  invalid: [
    // unknown token in token-list value
    {
      code: '<div bp-layout="flex"></div>',
      options: [webqOption],
      errors: [{ messageId: 'unknownCustomAttrValue' }]
    },
    // unknown enum value
    {
      code: '<div bp-theme="neon"></div>',
      options: [webqOption],
      errors: [{ messageId: 'unknownCustomAttrValue' }]
    },
    // multiple unknown tokens
    {
      code: '<div bp-layout="flex gap:xxl"></div>',
      options: [webqOption],
      errors: [{ messageId: 'unknownCustomAttrValue' }, { messageId: 'unknownCustomAttrValue' }]
    }
  ]
});
