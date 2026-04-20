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
  readonly #manifests: Manifest[];
  readonly #elements: Map<string, Declaration>;
  readonly #modules: Map<string, Module>;

  constructor(...manifests: Manifest[]) {
    this.#manifests = manifests;
    this.#elements = new Map();
    this.#modules = new Map();
    this.#index();
  }

  getManifests(): Manifest[] {
    return this.#manifests;
  }

  #indexModule(module: Module): void {
    this.#modules.set(module.path, module);
    if (!module.declarations) return;
    for (const decl of module.declarations) {
      if (decl.tagName) {
        this.#elements.set(decl.tagName, decl);
      }
    }
  }

  #index(): void {
    for (const manifest of this.#manifests) {
      for (const module of manifest.modules) {
        this.#indexModule(module);
      }
    }
  }

  listElements(): Declaration[] {
    return [...this.#elements.values()].sort((first, second) =>
      (first.tagName ?? '').localeCompare(second.tagName ?? '')
    );
  }

  getElement(tagName: string): Declaration | undefined {
    return this.#elements.get(tagName);
  }

  searchElements(query: string): Declaration[] {
    const needle = query.toLowerCase();
    const results: Declaration[] = [];
    for (const decl of this.#elements.values()) {
      if (
        (decl.tagName ?? '').toLowerCase().includes(needle) ||
        decl.name.toLowerCase().includes(needle) ||
        (decl.description ?? '').toLowerCase().includes(needle)
      ) {
        results.push(decl);
      }
    }
    return results.sort((first, second) => (first.tagName ?? '').localeCompare(second.tagName ?? ''));
  }

  getModule(path: string): Module | undefined {
    return this.#modules.get(path);
  }

  listModules(): Module[] {
    return [...this.#modules.values()].sort((first, second) => first.path.localeCompare(second.path));
  }

  getAttributes(tagName: string): Attribute[] {
    return this.getElement(tagName)?.attributes ?? [];
  }

  getProperties(tagName: string): Member[] {
    const elem = this.getElement(tagName);
    if (!elem) return [];
    return (elem.members ?? []).filter(member => member.kind === KindField);
  }

  getMethods(tagName: string): Member[] {
    const elem = this.getElement(tagName);
    if (!elem) return [];
    return (elem.members ?? []).filter(member => member.kind === KindMethod);
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
    return summaries.sort((first, second) => first.tagName.localeCompare(second.tagName));
  }
}
