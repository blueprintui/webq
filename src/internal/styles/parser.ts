import { readFile } from 'fs/promises';
import type { CustomStylesFile } from './types.js';

export async function parseCustomStyles(path: string): Promise<CustomStylesFile> {
  const data = await readFile(path, 'utf-8');
  return JSON.parse(data) as CustomStylesFile;
}
