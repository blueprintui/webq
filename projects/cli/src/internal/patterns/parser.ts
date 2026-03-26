import { readFile } from 'fs/promises';
import type { PatternsFile, ElementRef } from './types.js';
import { parseElementRef } from './types.js';

export async function parsePatterns(path: string): Promise<PatternsFile> {
  const data = await readFile(path, 'utf-8');
  const raw = JSON.parse(data);
  return normalizePatternsFile(raw);
}

function normalizePatternsFile(raw: unknown): PatternsFile {
  const pf = raw as PatternsFile;
  if (pf.patterns) {
    for (const pattern of pf.patterns) {
      if (pattern.structure) {
        if (pattern.structure.root) {
          pattern.structure.root = parseElementRef(pattern.structure.root);
        }
        if (pattern.structure.children) {
          for (const child of pattern.structure.children) {
            if (child.element) {
              child.element = parseElementRef(child.element);
            }
            if (child.options) {
              child.options = child.options
                .map((o: unknown) => parseElementRef(o))
                .filter((x): x is ElementRef => x !== undefined);
            }
          }
        }
      }
    }
  }
  return pf;
}
