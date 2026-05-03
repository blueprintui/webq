import { describe, test, expect, afterEach } from 'bun:test';
import { resolveFile, resolveFiles } from './resolve.js';
import { join } from 'path';
import { mkdir, mkdtemp, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';

const testdataPath = join(import.meta.dir, '../../../testdata');

let tempDirs: string[] = [];

afterEach(async () => {
  for (const d of tempDirs) {
    await rm(d, { recursive: true, force: true });
  }
  tempDirs = [];
});

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'resolve-test-'));
  tempDirs.push(dir);
  return dir;
}

describe('resolveFile', () => {
  test('returns path when file exists', async () => {
    const result = await resolveFile(testdataPath, 'custom-elements.json');
    expect(result).toBe(join(testdataPath, 'custom-elements.json'));
  });

  test('returns empty string when file does not exist', async () => {
    const result = await resolveFile(testdataPath, 'nonexistent.json');
    expect(result).toBe('');
  });

  test('returns empty string when directory does not exist', async () => {
    const result = await resolveFile(join(testdataPath, 'no-such-dir'), 'custom-elements.json');
    expect(result).toBe('');
  });

  test('throws when path is not a directory', async () => {
    const filePath = join(testdataPath, 'custom-elements.json');
    await expect(resolveFile(filePath, 'custom-elements.json')).rejects.toThrow('is not a directory');
  });

  test('finds file in a temp directory', async () => {
    const dir = await makeTempDir();
    await writeFile(join(dir, 'test.json'), '{}');
    const result = await resolveFile(dir, 'test.json');
    expect(result).toBe(join(dir, 'test.json'));
  });
});

describe('resolveFiles', () => {
  test('finds matches recursively', async () => {
    const dir = await makeTempDir();
    const nested = join(dir, 'a', 'b');
    await mkdir(nested, { recursive: true });
    await writeFile(join(dir, 'tokens.json'), '{}');
    await writeFile(join(nested, 'tokens.json'), '{}');

    const result = await resolveFiles(dir, 'tokens.json');
    expect(result.sort()).toEqual([join(dir, 'tokens.json'), join(nested, 'tokens.json')].sort());
  });

  test('skips well-known build/cache dirs', async () => {
    const dir = await makeTempDir();
    const skipped = join(dir, '.git');
    await mkdir(skipped, { recursive: true });
    await writeFile(join(skipped, 'tokens.json'), '{}');

    const result = await resolveFiles(dir, 'tokens.json');
    expect(result).toEqual([]);
  });

  test('returns empty array for non-existent directory', async () => {
    const result = await resolveFiles(join(testdataPath, 'no-such-dir'), 'tokens.json');
    expect(result).toEqual([]);
  });

  test('throws when path is not a directory', async () => {
    const filePath = join(testdataPath, 'custom-elements.json');
    await expect(resolveFiles(filePath, 'tokens.json')).rejects.toThrow('is not a directory');
  });
});
