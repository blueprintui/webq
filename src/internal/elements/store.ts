import { KindField, KindMethod } from './types.js';
import type {
  Manifest,
  Declaration,
  Module,
  Attribute,
  Member,
  Event,
  Slot,
  CSSProperty,
  Command,
  CSSPart
} from './types.js';

export interface ElementSummary {
  tagName: string;
  description?: string;
}

export class Store {
  #manifests: Manifest[];
  #elements: Map<string, Declaration> = new Map();
  #modules: Map<string, Module> = new Map();

  constructor(...manifests: Manifest[]) {
    this.#manifests = manifests;
    this.#index();
  }

  getManifests(): Manifest[] {
    return this.#manifests;
  }

  #index(): void {
    for (const manifest of this.#manifests) {
      for (const module of manifest.modules) {
        this.#modules.set(module.path, module);
        if (module.declarations) {
          for (const decl of module.declarations) {
            if (decl.tagName) {
              this.#elements.set(decl.tagName, decl);
            }
          }
        }
      }
    }
  }

  listElements(): Declaration[] {
    return [...this.#elements.values()].sort((a, b) => (a.tagName ?? '').localeCompare(b.tagName ?? ''));
  }

  getElement(tagName: string): Declaration | undefined {
    return this.#elements.get(tagName);
  }

  searchElements(query: string): Declaration[] {
    const q = query.toLowerCase();
    const results: Declaration[] = [];
    for (const decl of this.#elements.values()) {
      if (
        (decl.tagName ?? '').toLowerCase().includes(q) ||
        decl.name.toLowerCase().includes(q) ||
        (decl.description ?? '').toLowerCase().includes(q)
      ) {
        results.push(decl);
      }
    }
    return results.sort((a, b) => (a.tagName ?? '').localeCompare(b.tagName ?? ''));
  }

  getModule(path: string): Module | undefined {
    return this.#modules.get(path);
  }

  listModules(): Module[] {
    return [...this.#modules.values()].sort((a, b) => a.path.localeCompare(b.path));
  }

  getAttributes(tagName: string): Attribute[] {
    return this.getElement(tagName)?.attributes ?? [];
  }

  getProperties(tagName: string): Member[] {
    const elem = this.getElement(tagName);
    if (!elem) return [];
    return (elem.members ?? []).filter(m => m.kind === KindField);
  }

  getMethods(tagName: string): Member[] {
    const elem = this.getElement(tagName);
    if (!elem) return [];
    return (elem.members ?? []).filter(m => m.kind === KindMethod);
  }

  getEvents(tagName: string): Event[] {
    return this.getElement(tagName)?.events ?? [];
  }

  getSlots(tagName: string): Slot[] {
    return this.getElement(tagName)?.slots ?? [];
  }

  getCSSProperties(tagName: string): CSSProperty[] {
    return this.getElement(tagName)?.cssProperties ?? [];
  }

  getCommands(tagName: string): Command[] {
    return this.getElement(tagName)?.commands ?? [];
  }

  getCSSParts(tagName: string): CSSPart[] {
    return this.getElement(tagName)?.cssParts ?? [];
  }

  getElementSummaries(): ElementSummary[] {
    const summaries: ElementSummary[] = [];
    for (const decl of this.#elements.values()) {
      summaries.push({
        tagName: decl.tagName as string,
        description: decl.summary || decl.description
      });
    }
    return summaries.sort((a, b) => a.tagName.localeCompare(b.tagName));
  }
}
