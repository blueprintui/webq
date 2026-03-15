import type { CustomAttribute, CustomAttributesFile } from './types.js';

export interface CustomAttributeSummary {
  name: string;
  description: string;
  syntax?: string;
  tags?: string[];
}

export class CustomAttributeStore {
  #attributes: Map<string, CustomAttribute> = new Map();

  constructor(caf: CustomAttributesFile) {
    for (const a of caf.attributes) {
      this.#attributes.set(a.name, a);
    }
  }

  getCustomAttributes(): CustomAttributeSummary[] {
    const summaries: CustomAttributeSummary[] = [];
    for (const a of this.#attributes.values()) {
      summaries.push({
        name: a.name,
        description: a.description,
        syntax: a.syntax,
        tags: a.tags
      });
    }
    return summaries.sort((a, b) => a.name.localeCompare(b.name));
  }

  getCustomAttribute(name: string): CustomAttribute | undefined {
    return this.#attributes.get(name);
  }
}
