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

  test('validate returns no errors for valid manifest', async () => {
    const manifest = await parseManifest(testdataPath);
    const errs = validate(manifest);
    expect(errs.length).toBe(0);
  });
});
