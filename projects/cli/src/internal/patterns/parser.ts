import { readFile } from 'fs/promises';
import type { PatternsFile, ElementRef } from './types.js';
import { parseElementRef } from './types.js';

export async function parsePatterns(path: string): Promise<PatternsFile> {
  const data = await readFile(path, 'utf-8');
  const raw = JSON.parse(data);
  return normalizePatternsFile(raw);
}

type Pattern = NonNullable<PatternsFile['patterns']>[number];
type PatternChild = NonNullable<NonNullable<Pattern['structure']>['children']>[number];

function normalizeChild(child: PatternChild): void {
  if (child.element) {
    child.element = parseElementRef(child.element);
  }
  if (child.options) {
    child.options = child.options
      .map((opt: unknown) => parseElementRef(opt))
      .filter((ref): ref is ElementRef => ref !== undefined);
  }
}

function normalizePattern(pattern: Pattern): void {
  if (!pattern.structure) return;
  if (pattern.structure.root) {
    pattern.structure.root = parseElementRef(pattern.structure.root);
  }
  if (pattern.structure.children) {
    for (const child of pattern.structure.children) {
      normalizeChild(child);
    }
  }
}

export function normalizePatternsFile(raw: unknown): PatternsFile {
  const pf = raw as PatternsFile;
  if (pf.patterns) {
    for (const pattern of pf.patterns) {
      normalizePattern(pattern);
    }
  }
  return pf;
}
