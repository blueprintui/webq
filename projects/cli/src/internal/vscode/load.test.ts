import { describe, test, expect } from 'bun:test';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { load } from './load.js';

describe('load', () => {
  test('returns empty manifests for dir with no vscode data', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'webq-test-'));
    try {
      const result = await load(dir);
      expect(result.manifests).toEqual([]);
      expect(result.attributes).toBeUndefined();
      expect(result.styles).toBeUndefined();
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  test('returns empty for nonexistent path (silently skips ENOENT)', async () => {
    const dir = join(tmpdir(), 'webq-test-nonexistent-' + Date.now());
    const result = await load(dir);
    expect(result.manifests).toEqual([]);
    expect(result.attributes).toBeUndefined();
    expect(result.styles).toBeUndefined();
  });

  test('returns empty for empty string paths', async () => {
    const result = await load('');
    expect(result.manifests).toEqual([]);
    expect(result.attributes).toBeUndefined();
    expect(result.styles).toBeUndefined();
  });
});
