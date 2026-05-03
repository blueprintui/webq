import { resolveFiles } from '../resolve/resolve.js';

export const CustomAttributesFilename = 'custom-attributes.json';

export async function resolve(path: string): Promise<string[]> {
  return resolveFiles(path, CustomAttributesFilename);
}
