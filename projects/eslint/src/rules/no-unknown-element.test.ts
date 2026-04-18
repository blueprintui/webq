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
    },
    // empty allowlist: manifest elements still valid
    {
      code: '<my-alert></my-alert>',
      options: [{ path: webqPath, tags: [] }]
    },
    // duplicate entries in allowlist are tolerated
    {
      code: '<x-dup></x-dup>',
      options: [{ path: webqPath, tags: ['x-dup', 'x-dup'] }]
    },
    // allowlist entry that duplicates a manifest element is still valid
    {
      code: '<my-alert></my-alert>',
      options: [{ path: webqPath, tags: ['my-alert'] }]
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
    },
    {
      code: `<div>
  <not-listed>
    <span></span>
  </not-listed>
</div>`,
      options: [{ path: webqPath, tags: ['other-element'] }],
      errors: [{ messageId: 'unknownElement', line: 2, column: 3, endLine: 4, endColumn: 15 }]
    },
    // multiple distinct unknown elements each reported
    {
      code: '<x-a></x-a><x-b></x-b>',
      options: [webqOption],
      errors: [{ messageId: 'unknownElement' }, { messageId: 'unknownElement' }]
    },
    // empty allowlist does not suppress errors
    {
      code: '<x-unknown></x-unknown>',
      options: [{ path: webqPath, tags: [] }],
      errors: [{ messageId: 'unknownElement' }]
    }
  ]
});
