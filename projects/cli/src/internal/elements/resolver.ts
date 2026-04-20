import { stat, readdir } from 'fs/promises';
import { join } from 'path';

export const ManifestFilename = 'custom-elements.json';

const skipDirs = new Set(['.wireit', '.git', '.cache', '.turbo', '.nx', '.parcel-cache']);

export async function resolvePaths(pathsStr: string): Promise<string[]> {
  if (!pathsStr) return [];

  const paths = pathsStr.split(',');
  const result: string[] = [];

  for (const path of paths) {
    const trimmed = path.trim();
    if (!trimmed) continue;
    const resolved = await resolvePath(trimmed);
    result.push(...resolved);
  }

  return result;
}

export async function resolvePath(path: string): Promise<string[]> {
  const info = await stat(path);
  if (!info.isDirectory()) {
    throw new Error(`path "${path}" is not a directory`);
  }

  const manifests: string[] = [];
  await walkDir(path, manifests);
  return manifests;
}

async function walkDir(dir: string, manifests: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) {
        await walkDir(fullPath, manifests);
      }
    } else if (entry.name === ManifestFilename) {
      manifests.push(fullPath);
    }
  }
}
