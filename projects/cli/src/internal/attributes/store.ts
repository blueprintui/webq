import type { CustomAttribute, CustomAttributesFile } from './types.js';

export interface CustomAttributeSummary {
  name: string;
  description: string;
  syntax?: string;
  tags?: string[];
}

export class CustomAttributeStore {
  readonly #attributes: Map<string, CustomAttribute>;

  constructor(caf: CustomAttributesFile) {
    this.#attributes = new Map();
    for (const attr of caf.attributes) {
      this.#attributes.set(attr.name, attr);
    }
  }

  getCustomAttributes(): CustomAttributeSummary[] {
    const summaries: CustomAttributeSummary[] = [];
    for (const attr of this.#attributes.values()) {
      summaries.push({
        name: attr.name,
        description: attr.description,
        syntax: attr.syntax,
        tags: attr.tags
      });
    }
    return summaries.sort((left, right) => left.name.localeCompare(right.name));
  }

  getCustomAttribute(name: string): CustomAttribute | undefined {
    return this.#attributes.get(name);
  }
}
