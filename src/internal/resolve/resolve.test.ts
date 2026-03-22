import { describe, test, expect, afterEach } from 'bun:test';
import { resolveFile } from './resolve.js';
import { join } from 'path';
import { mkdtemp, writeFile, rm } from 'fs/promises';
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
