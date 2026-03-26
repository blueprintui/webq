import { describe, test, expect } from 'bun:test';
import { mkdtemp, writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { resolve } from './resolver.js';

describe('resolve', () => {
  test('returns empty array for dir with no package.json files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'webq-test-'));
    try {
      const refs = await resolve(dir);
      expect(refs).toEqual([]);
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  test('finds package.json with html.customData and returns correct refs', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'webq-test-'));
    try {
      const pkg = {
        name: 'test-pkg',
        html: { customData: ['./dist/html-data.json'] },
        css: { customData: ['./dist/css-data.json'] }
      };
      await writeFile(join(dir, 'package.json'), JSON.stringify(pkg));

      const refs = await resolve(dir);
      expect(refs.length).toBe(1);
      expect(refs[0].dir).toBe(dir);
      expect(refs[0].htmlDataPaths).toEqual([join(dir, 'dist/html-data.json')]);
      expect(refs[0].cssDataPaths).toEqual([join(dir, 'dist/css-data.json')]);
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  test('skips package.json without customData fields', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'webq-test-'));
    try {
      const pkg = { name: 'plain-pkg', version: '1.0.0' };
      await writeFile(join(dir, 'package.json'), JSON.stringify(pkg));

      const refs = await resolve(dir);
      expect(refs).toEqual([]);
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  test('throws for non-directory path', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'webq-test-'));
    const filePath = join(dir, 'somefile.txt');
    try {
      await writeFile(filePath, 'hello');
      await expect(resolve(filePath)).rejects.toThrow('is not a directory');
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  test('skips .git directories', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'webq-test-'));
    try {
      const gitDir = join(dir, '.git');
      await mkdir(gitDir, { recursive: true });
      const pkg = {
        name: 'hidden-pkg',
        html: { customData: ['./data.json'] }
      };
      await writeFile(join(gitDir, 'package.json'), JSON.stringify(pkg));

      const refs = await resolve(dir);
      expect(refs).toEqual([]);
    } finally {
      await rm(dir, { recursive: true });
    }
  });
});
