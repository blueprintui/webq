import { stat, readdir } from 'fs/promises';
import { join } from 'path';

const skipDirs = new Set(['.wireit', '.git', '.cache', '.turbo', '.nx', '.parcel-cache']);

export async function resolveFile(dir: string, filename: string): Promise<string> {
  try {
    const info = await stat(dir);
    if (!info.isDirectory()) {
      throw new Error(`path "${dir}" is not a directory`);
    }
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return '';
    throw err;
  }

  const candidate = join(dir, filename);
  try {
    await stat(candidate);
    return candidate;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return '';
    throw err;
  }
}

export async function resolveFiles(dir: string, filename: string): Promise<string[]> {
  let info;
  try {
    info = await stat(dir);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
  if (!info.isDirectory()) {
    throw new Error(`path "${dir}" is not a directory`);
  }

  const matches: string[] = [];
  await walkDir(dir, filename, matches);
  return matches;
}

async function walkDir(dir: string, filename: string, matches: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) {
        await walkDir(fullPath, filename, matches);
      }
    } else if (entry.name === filename) {
      matches.push(fullPath);
    }
  }
}
