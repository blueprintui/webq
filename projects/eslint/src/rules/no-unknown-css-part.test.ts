import rule from './no-unknown-css-part.js';
import { ruleTester, webqOption } from './test-utils.js';

ruleTester.run('no-unknown-css-part', rule, {
  valid: [
    // valid parts
    {
      code: '<style>my-alert::part(base) { color: red; }</style>',
      options: [webqOption]
    },
    {
      code: '<style>my-alert::part(content) { padding: 8px; }</style>',
      options: [webqOption]
    },
    // non-custom element — skip
    {
      code: '<style>div::part(foo) { color: red; }</style>',
      options: [webqOption]
    },
    // unknown custom element — not in CEM, skip
    {
      code: '<style>my-unknown::part(foo) { color: red; }</style>',
      options: [webqOption]
    },
    // no style tag
    {
      code: '<my-alert></my-alert>',
      options: [webqOption]
    }
  ],
  invalid: [
    {
      code: '<style>my-alert::part(header) { color: red; }</style>',
      options: [webqOption],
      errors: [{ messageId: 'unknownCssPart' }]
    },
    {
      code: '<style>my-alert::part(footer) { color: red; }</style>',
      options: [webqOption],
      errors: [{ messageId: 'unknownCssPart' }]
    },
    // multiple invalid parts
    {
      code: '<style>my-alert::part(header) { color: red; } my-alert::part(footer) { color: blue; }</style>',
      options: [webqOption],
      errors: [{ messageId: 'unknownCssPart' }, { messageId: 'unknownCssPart' }]
    }
  ]
});
