import { readFile } from 'fs/promises';
import type { DTCGFile } from './types.js';

export async function parseDTCG(path: string): Promise<DTCGFile> {
  const data = await readFile(path, 'utf-8');
  return JSON.parse(data) as DTCGFile;
}
