import { describe, test, expect } from 'bun:test';
import { parseManifest, parseManifestFromString, validate } from './parser.js';
import type { Manifest } from './types.js';
import { join } from 'path';

const testdataPath = join(import.meta.dir, '../../../testdata/custom-elements.json');

describe('Parser', () => {
  test('parseManifest reads and parses file', async () => {
    const manifest = await parseManifest(testdataPath);
    expect(manifest.schemaVersion).toBe('1.0.0');
    expect(manifest.modules.length).toBe(4);
  });

  test('parseManifestFromString parses JSON', () => {
    const json =
      '{"schemaVersion":"1.0.0","modules":[{"kind":"javascript-module","path":"test.js","declarations":[{"kind":"class","name":"Test"}]}]}';
    const manifest = parseManifestFromString(json);
    expect(manifest.schemaVersion).toBe('1.0.0');
    expect(manifest.modules.length).toBe(1);
  });

  test('validate returns errors for invalid manifest', () => {
    const errs = validate({ schemaVersion: '', modules: [] } as unknown as Manifest);
    expect(errs.length).toBe(2);
  });

  test('validate reports missing module path and kind', () => {
    const errs = validate({
      schemaVersion: '1.0.0',
      modules: [{ declarations: [] }]
    } as unknown as Manifest);
    expect(errs.some(e => e.message.includes('missing path'))).toBe(true);
    expect(errs.some(e => e.message.includes('missing kind'))).toBe(true);
  });

  test('validate reports missing declaration name', () => {
    const errs = validate({
      schemaVersion: '1.0.0',
      modules: [{ path: 'test.js', kind: 'javascript-module', declarations: [{}] }]
    } as unknown as Manifest);
    expect(errs.some(e => e.message.includes('missing name'))).toBe(true);
  });

  test('validateFile reads and validates', async () => {
    const { validateFile } = await import('./parser.js');
    const { manifest, errors } = await validateFile(testdataPath);
    expect(manifest.schemaVersion).toBe('1.0.0');
    expect(errors.length).toBe(0);
  });

  test('validate returns no errors for valid manifest', async () => {
    const manifest = await parseManifest(testdataPath);
    const errs = validate(manifest);
    expect(errs.length).toBe(0);
  });
});
