import { readFile } from 'fs/promises';
import type { HTMLCustomData, CSSCustomData } from './types.js';

export async function parseHTMLCustomData(path: string): Promise<HTMLCustomData> {
  const data = await readFile(path, 'utf-8');
  return JSON.parse(data) as HTMLCustomData;
}

export async function parseCSSCustomData(path: string): Promise<CSSCustomData> {
  const data = await readFile(path, 'utf-8');
  return JSON.parse(data) as CSSCustomData;
}
