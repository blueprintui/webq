import { describe, test, expect } from 'bun:test';
import { NoUnknownCustomAttrValue } from './no-unknown-custom-attr-value.js';
import { CustomAttributeStore } from '../../attributes/store.js';
import type { CustomAttributesFile } from '../../attributes/types.js';
import { parseHTML } from '../html.js';
import { makeStore } from './test-helper.js';
import { Severity } from '../types.js';

function makeCustomAttrStore(): CustomAttributeStore {
  const caf: CustomAttributesFile = {
    schemaVersion: '1.0.0',
    attributes: [
      {
        name: 'bp-layout',
        description: 'Layout attribute',
        syntax: 'token-list',
        appliesTo: { all: true, elements: [] },
        tokenGroups: [
          {
            name: 'type',
            values: [{ value: 'block' }, { value: 'inline' }, { value: 'grid' }]
          },
          {
            name: 'gap',
            values: [{ value: 'gap:none' }, { value: 'gap:sm' }, { value: 'gap:md' }, { value: 'gap:lg' }]
          }
        ]
      },
      {
        name: 'bp-theme',
        description: 'Theme attribute',
        syntax: 'enum',
        appliesTo: { all: true, elements: [] },
        values: [{ value: 'light' }, { value: 'dark' }, { value: 'auto' }]
      },
      {
        name: 'bp-interactive',
        description: 'Interactive attribute',
        syntax: 'boolean',
        appliesTo: { all: true, elements: [] }
      },
      {
        name: 'bp-card-layout',
        description: 'Card layout',
        syntax: 'token-list',
        appliesTo: { all: false, elements: ['bp-card'] },
        tokenGroups: [
          {
            name: 'type',
            values: [{ value: 'horizontal' }, { value: 'vertical' }]
          }
        ]
      }
    ]
  };
  return new CustomAttributeStore(caf);
}

describe('NoUnknownCustomAttrValue', () => {
  test('valid token-list produces no messages', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button bp-layout="grid gap:md"></bp-button>');
    const rule = new NoUnknownCustomAttrValue();
    rule.setCustomAttributeStore(makeCustomAttrStore());
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('unknown tokens produce warnings', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button bp-layout="flex gap:xxl"></bp-button>');
    const rule = new NoUnknownCustomAttrValue();
    rule.setCustomAttributeStore(makeCustomAttrStore());
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(2);
    expect(msgs[0].message).toContain('flex');
    expect(msgs[1].message).toContain('gap:xxl');
    expect(msgs[0].severity).toBe(Severity.Warning);
  });

  test('valid enum produces no messages', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button bp-theme="dark"></bp-button>');
    const rule = new NoUnknownCustomAttrValue();
    rule.setCustomAttributeStore(makeCustomAttrStore());
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('invalid enum produces warning', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button bp-theme="neon"></bp-button>');
    const rule = new NoUnknownCustomAttrValue();
    rule.setCustomAttributeStore(makeCustomAttrStore());
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].message).toContain('neon');
    expect(msgs[0].message).toContain('Valid values:');
  });

  test('boolean syntax skips validation', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button bp-interactive></bp-button>');
    const rule = new NoUnknownCustomAttrValue();
    rule.setCustomAttributeStore(makeCustomAttrStore());
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('nil store produces no messages', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button bp-layout="flex"></bp-button>');
    const rule = new NoUnknownCustomAttrValue();
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('unknown attribute name skipped', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button unknown-thing="whatever"></bp-button>');
    const rule = new NoUnknownCustomAttrValue();
    rule.setCustomAttributeStore(makeCustomAttrStore());
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('appliesTo specific element validates on matching', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-card bp-card-layout="horizontal"></bp-card>');
    const rule = new NoUnknownCustomAttrValue();
    rule.setCustomAttributeStore(makeCustomAttrStore());
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('appliesTo specific element skips on non-matching', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button bp-card-layout="horizontal"></bp-button>');
    const rule = new NoUnknownCustomAttrValue();
    rule.setCustomAttributeStore(makeCustomAttrStore());
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('mixed valid and invalid tokens', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button bp-layout="grid gap:xxl"></bp-button>');
    const rule = new NoUnknownCustomAttrValue();
    rule.setCustomAttributeStore(makeCustomAttrStore());
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].message).toContain('gap:xxl');
  });

  test('native element with valid tokens', () => {
    const store = makeStore();
    const doc = parseHTML('<div bp-layout="grid gap:md"></div>');
    const rule = new NoUnknownCustomAttrValue();
    rule.setCustomAttributeStore(makeCustomAttrStore());
    expect(rule.check(doc, store)).toEqual([]);
  });
});
