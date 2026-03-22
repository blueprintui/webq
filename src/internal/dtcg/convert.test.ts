import { describe, it, expect } from 'bun:test';
import { convertDTCG } from './convert.js';
import type { DTCGFile } from './types.js';

describe('convertDTCG', () => {
  it('converts root-level token', () => {
    const data: DTCGFile = {
      'spacing-sm': { $value: '4px', $type: 'dimension' }
    };
    const result = convertDTCG(data);
    expect(result.cssCustomProperties).toEqual([{ name: '--spacing-sm', value: '4px', type: 'dimension' }]);
  });

  it('converts nested token with tags', () => {
    const data: DTCGFile = {
      color: {
        brand: { $value: '#0066cc', $type: 'color', $description: 'Primary brand color' }
      }
    };
    const result = convertDTCG(data);
    expect(result.cssCustomProperties).toEqual([
      { name: '--color-brand', value: '#0066cc', type: 'color', description: 'Primary brand color', tags: ['color'] }
    ]);
  });

  it('converts deeply nested token', () => {
    const data: DTCGFile = {
      a: {
        b: {
          c: { $value: '1px', $type: 'dimension' }
        }
      }
    };
    const result = convertDTCG(data);
    expect(result.cssCustomProperties).toEqual([
      { name: '--a-b-c', value: '1px', type: 'dimension', tags: ['a', 'b'] }
    ]);
  });

  it('inherits $type from parent group', () => {
    const data: DTCGFile = {
      color: {
        $type: 'color',
        brand: { $value: '#0066cc' }
      }
    };
    const result = convertDTCG(data);
    expect(result.cssCustomProperties[0].type).toBe('color');
  });

  it('child $type overrides parent $type', () => {
    const data: DTCGFile = {
      color: {
        $type: 'color',
        special: { $value: '#ff0000', $type: 'accent-color' }
      }
    };
    const result = convertDTCG(data);
    expect(result.cssCustomProperties[0].type).toBe('accent-color');
  });

  it('does not traverse $-prefixed keys as children', () => {
    const data: DTCGFile = {
      group: {
        $type: 'color',
        $description: 'A group',
        token: { $value: '#fff' }
      }
    };
    const result = convertDTCG(data);
    expect(result.cssCustomProperties).toHaveLength(1);
    expect(result.cssCustomProperties[0].name).toBe('--group-token');
  });

  it('sets description to undefined when $description is missing', () => {
    const data: DTCGFile = {
      token: { $value: '1px' }
    };
    const result = convertDTCG(data);
    expect(result.cssCustomProperties[0].description).toBeUndefined();
  });

  it('stringifies numeric $value', () => {
    const data: DTCGFile = {
      spacing: { $value: 4, $type: 'dimension' }
    };
    const result = convertDTCG(data);
    expect(result.cssCustomProperties[0].value).toBe('4');
  });

  it('returns schemaVersion 1.0.0', () => {
    const data: DTCGFile = {
      token: { $value: '1px' }
    };
    const result = convertDTCG(data);
    expect(result.schemaVersion).toBe('1.0.0');
  });

  it('root-level token has empty tags', () => {
    const data: DTCGFile = {
      'spacing-sm': { $value: '4px' }
    };
    const result = convertDTCG(data);
    expect(result.cssCustomProperties[0].tags).toBeUndefined();
  });
});
