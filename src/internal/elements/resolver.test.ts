import { describe, test, expect, afterEach } from 'bun:test';
import { resolvePaths, resolvePath, ManifestFilename } from './resolver.js';
import { join } from 'path';
import { mkdtemp, mkdir, writeFile, rm } from 'fs/promises';
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
  const dir = await mkdtemp(join(tmpdir(), 'resolver-test-'));
  tempDirs.push(dir);
  return dir;
}

describe('resolvePaths', () => {
  test('returns empty array for empty string', async () => {
    const result = await resolvePaths('');
    expect(result).toEqual([]);
  });

  test('finds manifests in testdata', async () => {
    const result = await resolvePaths(testdataPath);
    expect(result).toContain(join(testdataPath, ManifestFilename));
  });

  test('handles comma-separated paths', async () => {
    const dir1 = await makeTempDir();
    const dir2 = await makeTempDir();
    await writeFile(join(dir1, ManifestFilename), '{}');
    await writeFile(join(dir2, ManifestFilename), '{}');
    const result = await resolvePaths(`${dir1},${dir2}`);
    expect(result).toContain(join(dir1, ManifestFilename));
    expect(result).toContain(join(dir2, ManifestFilename));
  });

  test('trims whitespace in paths', async () => {
    const dir = await makeTempDir();
    await writeFile(join(dir, ManifestFilename), '{}');
    const result = await resolvePaths(`  ${dir}  `);
    expect(result).toContain(join(dir, ManifestFilename));
  });
});

describe('resolvePath', () => {
  test('finds manifest in testdata', async () => {
    const result = await resolvePath(testdataPath);
    expect(result).toContain(join(testdataPath, ManifestFilename));
  });

  test('throws for non-directory path', async () => {
    const filePath = join(testdataPath, ManifestFilename);
    await expect(resolvePath(filePath)).rejects.toThrow('is not a directory');
  });

  test('skips .git directories', async () => {
    const dir = await makeTempDir();
    const gitDir = join(dir, '.git');
    await mkdir(gitDir);
    await writeFile(join(gitDir, ManifestFilename), '{}');
    const result = await resolvePath(dir);
    expect(result).not.toContain(join(gitDir, ManifestFilename));
  });

  test('finds manifests in nested directories', async () => {
    const dir = await makeTempDir();
    const nested = join(dir, 'packages', 'my-lib');
    await mkdir(nested, { recursive: true });
    await writeFile(join(nested, ManifestFilename), '{}');
    const result = await resolvePath(dir);
    expect(result).toContain(join(nested, ManifestFilename));
  });

  test('returns empty array when no manifests found', async () => {
    const dir = await makeTempDir();
    const result = await resolvePath(dir);
    expect(result).toEqual([]);
  });
});
