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
  try {
    const data = await readFile(path, 'utf-8');
    const pkg = JSON.parse(data);

    const htmlData = pkg?.html?.customData as string[] | undefined;
    const cssData = pkg?.css?.customData as string[] | undefined;

    if (!htmlData?.length && !cssData?.length) return undefined;

    const dir = dirname(path);
    return {
      dir,
      htmlDataPaths: (htmlData ?? []).map(rel => join(dir, rel)),
      cssDataPaths: (cssData ?? []).map(rel => join(dir, rel))
    };
  } catch {
    return undefined;
  }
}
