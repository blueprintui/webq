import { resolveFiles } from '../resolve/resolve.js';

export const PatternsFilename = 'custom-patterns.json';

export async function resolve(path: string): Promise<string[]> {
  return resolveFiles(path, PatternsFilename);
}
