import { resolveFile } from '../resolve/resolve.js';

export const CustomStylesFilename = 'custom-styles.json';

export async function resolve(path: string): Promise<string> {
  return resolveFile(path, CustomStylesFilename);
}
