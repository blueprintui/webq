import type { ElementRef, Pattern, PatternsFile } from './types.js';

export interface PatternSummary {
  name: string;
  description: string;
  tags?: string[];
}

export class PatternStore {
  #patterns: Map<string, Pattern> = new Map();

  constructor(pf: PatternsFile) {
    for (const p of pf.patterns) {
      this.#patterns.set(p.name, p);
    }
  }

  getPatterns(): PatternSummary[] {
    const summaries: PatternSummary[] = [];
    for (const p of this.#patterns.values()) {
      summaries.push({
        name: p.name,
        description: p.description,
        tags: p.tags
      });
    }
    return summaries.sort((a, b) => a.name.localeCompare(b.name));
  }

  getPattern(name: string): Pattern | undefined {
    return this.#patterns.get(name);
  }

  getPatternsForElement(tagName: string): Pattern[] {
    const result: Pattern[] = [];
    for (const p of this.#patterns.values()) {
      if (patternReferencesTag(p, tagName)) {
        result.push(p);
      }
    }
    return result;
  }
}

function patternReferencesTag(p: Pattern, tagName: string): boolean {
  if (p.structure.root && p.structure.root.tag === tagName) return true;
  if (childrenReferenceTag(p, tagName)) return true;
  if (siblingsReferenceTag(p, tagName)) return true;
  return false;
}

function childrenReferenceTag(p: Pattern, tagName: string): boolean {
  if (!p.structure.children) return false;
  for (const child of p.structure.children) {
    if (child.element && child.element.tag === tagName) return true;
    if (child.options && optionsReferenceTag(child.options, tagName)) return true;
  }
  return false;
}

function optionsReferenceTag(options: ElementRef[], tagName: string): boolean {
  for (const opt of options) {
    if (opt.tag === tagName) return true;
  }
  return false;
}

function siblingsReferenceTag(p: Pattern, tagName: string): boolean {
  if (!p.structure.siblings) return false;
  for (const sib of p.structure.siblings) {
    if (sib.trigger.tag === tagName || sib.target.tag === tagName) return true;
  }
  return false;
}
