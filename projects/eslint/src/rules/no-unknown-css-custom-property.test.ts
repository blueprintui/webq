import rule from './no-unknown-css-custom-property.js';
import { ruleTester, webqOption } from './test-utils.js';

ruleTester.run('no-unknown-css-custom-property', rule, {
  valid: [
    // valid CSS custom properties in style tag
    {
      code: '<style>my-alert { --alert-color: red; }</style>',
      options: [webqOption]
    },
    {
      code: '<style>my-alert { --alert-background: blue; }</style>',
      options: [webqOption]
    },
    // non-custom element selector — skip
    {
      code: '<style>div { --anything: red; }</style>',
      options: [webqOption]
    },
    // unknown custom element — not in CEM, skip
    {
      code: '<style>my-unknown { --foo: red; }</style>',
      options: [webqOption]
    },
    // valid inline style
    {
      code: '<my-alert style="--alert-color: red;"></my-alert>',
      options: [webqOption]
    },
    // inline style on non-custom element — skip
    {
      code: '<div style="--anything: red;"></div>',
      options: [webqOption]
    }
  ],
  invalid: [
    // unknown property in style tag
    {
      code: '<style>my-alert { --alert-border: 1px solid; }</style>',
      options: [webqOption],
      errors: [{ messageId: 'unknownCssProperty' }]
    },
    // unknown property in inline style
    {
      code: '<my-alert style="--alert-border: 1px solid;"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'unknownCssProperty' }]
    },
    // multiple unknown properties
    {
      code: '<style>my-alert { --alert-border: 1px; --alert-size: 16px; }</style>',
      options: [webqOption],
      errors: [{ messageId: 'unknownCssProperty' }, { messageId: 'unknownCssProperty' }]
    }
  ]
});
