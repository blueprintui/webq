import type { ElementRef, Pattern, PatternsFile } from './types.js';

export interface PatternSummary {
  name: string;
  description: string;
  tags?: string[];
}

export class PatternStore {
  readonly #patterns: Map<string, Pattern>;

  constructor(pf: PatternsFile) {
    this.#patterns = new Map();
    for (const pattern of pf.patterns) {
      this.#patterns.set(pattern.name, pattern);
    }
  }

  getPatterns(): PatternSummary[] {
    const summaries: PatternSummary[] = [];
    for (const pattern of this.#patterns.values()) {
      summaries.push({
        name: pattern.name,
        description: pattern.description,
        tags: pattern.tags
      });
    }
    return summaries.sort((first, second) => first.name.localeCompare(second.name));
  }

  getPattern(name: string): Pattern | undefined {
    return this.#patterns.get(name);
  }

  getPatternsForElement(tagName: string): Pattern[] {
    const result: Pattern[] = [];
    for (const pattern of this.#patterns.values()) {
      if (patternReferencesTag(pattern, tagName)) {
        result.push(pattern);
      }
    }
    return result;
  }
}

function patternReferencesTag(pattern: Pattern, tagName: string): boolean {
  if (pattern.structure.root && pattern.structure.root.tag === tagName) return true;
  if (childrenReferenceTag(pattern, tagName)) return true;
  if (siblingsReferenceTag(pattern, tagName)) return true;
  return false;
}

function childrenReferenceTag(pattern: Pattern, tagName: string): boolean {
  if (!pattern.structure.children) return false;
  for (const child of pattern.structure.children) {
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

function siblingsReferenceTag(pattern: Pattern, tagName: string): boolean {
  if (!pattern.structure.siblings) return false;
  for (const sib of pattern.structure.siblings) {
    if (sib.trigger.tag === tagName || sib.target.tag === tagName) return true;
  }
  return false;
}
