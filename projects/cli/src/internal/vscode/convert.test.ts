import { describe, test, expect } from 'bun:test';
import { convertHTML, convertCSS } from './convert.js';
import type { HTMLCustomData, CSSCustomData } from './types.js';

describe('convertHTML', () => {
  test('converts tags with custom element names to manifest declarations', () => {
    const data: HTMLCustomData = {
      version: 1.1,
      tags: [
        {
          name: 'my-component',
          description: 'A custom element',
          attributes: [{ name: 'variant', values: [{ name: 'primary' }, { name: 'secondary' }] }]
        }
      ]
    };
    const { manifest } = convertHTML(data);
    expect(manifest).toBeDefined();
    if (!manifest) return;
    const mod = manifest.modules[0];
    const decls = mod.declarations ?? [];
    const decl = decls[0];
    expect(manifest.modules.length).toBe(1);
    expect(decls.length).toBe(1);
    expect(decl.tagName).toBe('my-component');
    expect(decl.attributes?.[0].type?.text).toBe("'primary' | 'secondary'");
  });

  test('skips non-custom-element tags', () => {
    const data: HTMLCustomData = {
      version: 1.1,
      tags: [{ name: 'div', description: 'A standard div' }]
    };
    const { manifest } = convertHTML(data);
    expect(manifest).toBeUndefined();
  });

  test('converts global attributes to custom attributes file', () => {
    const data: HTMLCustomData = {
      version: 1.1,
      globalAttributes: [{ name: 'bp-theme', values: [{ name: 'light' }, { name: 'dark' }] }]
    };
    const { attributes } = convertHTML(data);
    expect(attributes).toBeDefined();
    expect(attributes?.attributes.length).toBe(1);
    expect(attributes?.attributes[0].name).toBe('bp-theme');
    expect(attributes?.attributes[0].syntax).toBe('enum');
    expect(attributes?.attributes[0].values?.length).toBe(2);
  });

  test('global attribute without values gets string syntax', () => {
    const data: HTMLCustomData = {
      version: 1.1,
      globalAttributes: [{ name: 'bp-custom' }]
    };
    const { attributes } = convertHTML(data);
    expect(attributes?.attributes[0].syntax).toBe('string');
  });

  test('resolves valueSet references', () => {
    const data: HTMLCustomData = {
      version: 1.1,
      tags: [
        {
          name: 'my-button',
          attributes: [{ name: 'variant', valueSet: 'variant-values' }]
        }
      ],
      valueSets: [{ name: 'variant-values', values: [{ name: 'primary' }, { name: 'danger' }] }]
    };
    const { manifest } = convertHTML(data);
    if (!manifest) return;
    const decl = (manifest.modules[0].declarations ?? [])[0];
    expect(decl.attributes?.[0].type?.text).toBe("'primary' | 'danger'");
  });

  test('handles description object with value field', () => {
    const data: HTMLCustomData = {
      version: 1.1,
      tags: [
        {
          name: 'my-element',
          description: { text: 'Element description' } as unknown as string
        }
      ]
    };
    const { manifest } = convertHTML(data);
    if (!manifest) return;
    const decl = (manifest.modules[0].declarations ?? [])[0];
    expect(decl.description).toBe('Element description');
  });

  test('returns undefined manifest and attributes when no data', () => {
    const data: HTMLCustomData = { version: 1.1 };
    const { manifest, attributes } = convertHTML(data);
    expect(manifest).toBeUndefined();
    expect(attributes).toBeUndefined();
  });
});

describe('convertCSS', () => {
  test('converts custom properties (-- prefix)', () => {
    const data: CSSCustomData = {
      version: 1.1,
      properties: [
        { name: '--my-color', description: 'Theme color' },
        { name: 'color', description: 'Standard property' }
      ]
    };
    const result = convertCSS(data);
    expect(result).toBeDefined();
    expect(result?.cssCustomProperties.length).toBe(1);
    expect(result?.cssCustomProperties[0].name).toBe('--my-color');
  });

  test('returns undefined when no custom properties', () => {
    const data: CSSCustomData = {
      version: 1.1,
      properties: [{ name: 'color', description: 'Not a custom prop' }]
    };
    expect(convertCSS(data)).toBeUndefined();
  });

  test('returns undefined when no properties at all', () => {
    const data: CSSCustomData = { version: 1.1 };
    expect(convertCSS(data)).toBeUndefined();
  });
});
