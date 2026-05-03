import { resolveFiles } from '../resolve/resolve.js';

export const DTCGTokensFilename = 'tokens.json';

export async function resolve(path: string): Promise<string[]> {
  return resolveFiles(path, DTCGTokensFilename);
}
