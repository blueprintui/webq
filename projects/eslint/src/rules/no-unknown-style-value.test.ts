import rule from './no-unknown-style-value.js';
import { ruleTester, webqOption } from './test-utils.js';

ruleTester.run('no-unknown-style-value', rule, {
  valid: [
    // valid var() referencing a global custom style token
    {
      code: '<style>my-alert { padding: var(--space-md); }</style>',
      options: [webqOption]
    },
    // valid var() referencing an element-scoped CEM cssProperty
    {
      code: '<style>my-alert { color: var(--alert-color); }</style>',
      options: [webqOption]
    },
    // non-custom-element selector with valid global token
    {
      code: '<style>.my-class { gap: var(--space-md); }</style>',
      options: [webqOption]
    },
    // no var() references — nothing to validate
    {
      code: '<style>my-alert { padding: 8px; }</style>',
      options: [webqOption]
    }
  ],
  invalid: [
    // unknown var() reference in custom element selector
    {
      code: '<style>my-alert { padding: var(--unknown-token); }</style>',
      options: [webqOption],
      errors: [{ messageId: 'unknownStyleValue' }]
    },
    // unknown var() reference in non-custom-element selector
    {
      code: '<style>.card { padding: var(--unknown-token); }</style>',
      options: [webqOption],
      errors: [{ messageId: 'unknownStyleValue' }]
    },
    // inline style with unknown var()
    {
      code: '<my-alert style="padding: var(--unknown-token)"></my-alert>',
      options: [webqOption],
      errors: [{ messageId: 'unknownStyleValue' }]
    },
    // var() with fallback still warns on unknown token
    {
      code: '<style>my-alert { padding: var(--unknown-token, 8px); }</style>',
      options: [webqOption],
      errors: [{ messageId: 'unknownStyleValue' }]
    },
    // multiple unknown var() refs
    {
      code: '<style>my-alert { padding: var(--unknown-a); margin: var(--unknown-b); }</style>',
      options: [webqOption],
      errors: [{ messageId: 'unknownStyleValue' }, { messageId: 'unknownStyleValue' }]
    }
  ]
});
