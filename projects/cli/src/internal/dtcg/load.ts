import type { CustomStylesFile } from '../styles/types.js';
import { parseDTCG } from './parser.js';
import { convertDTCG } from './convert.js';

export async function load(path: string): Promise<CustomStylesFile | undefined> {
  let data;
  try {
    data = await parseDTCG(path);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw err;
  }

  return convertDTCG(data);
}
