import { stat, readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';

const skipDirs = new Set(['.wireit', '.git', '.cache', '.turbo', '.nx', '.parcel-cache']);

export interface PackageJSONRef {
  dir: string;
  htmlDataPaths: string[];
  cssDataPaths: string[];
}

export async function resolve(dir: string): Promise<PackageJSONRef[]> {
  const info = await stat(dir);
  if (!info.isDirectory()) {
    throw new Error(`path "${dir}" is not a directory`);
  }

  const refs: PackageJSONRef[] = [];
  await walkDir(dir, refs);
  return refs;
}

async function walkDir(dir: string, refs: PackageJSONRef[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) {
        await walkDir(fullPath, refs);
      }
    } else if (entry.name === 'package.json') {
      const ref = await parsePackageJSON(fullPath);
      if (ref) refs.push(ref);
    }
  }
}

async function parsePackageJSON(path: string): Promise<PackageJSONRef | undefined> {
  const pkg = await readPackageJSON(path);
  if (!pkg) return undefined;

  const htmlData = extractCustomData(pkg, 'html');
  const cssData = extractCustomData(pkg, 'css');

  if (htmlData.length === 0 && cssData.length === 0) return undefined;

  const dir = dirname(path);
  return {
    dir,
    htmlDataPaths: resolvePaths(dir, htmlData),
    cssDataPaths: resolvePaths(dir, cssData)
  };
}

async function readPackageJSON(path: string): Promise<Record<string, unknown> | undefined> {
  try {
    const data = await readFile(path, 'utf-8');
    return JSON.parse(data) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function extractCustomData(pkg: Record<string, unknown>, key: 'html' | 'css'): string[] {
  const section = pkg[key] as { customData?: string[] } | undefined;
  return section?.customData ?? [];
}

function resolvePaths(dir: string, rels: string[]): string[] {
  return rels.map(rel => join(dir, rel));
}
