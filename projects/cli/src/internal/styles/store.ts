import type { CSSCustomProperty, CustomStylesFile } from './types.js';

export interface CSSCustomPropertySummary {
  name: string;
  description?: string;
  type?: string;
  tags?: string[];
}

export class CustomStyleStore {
  readonly #properties: Map<string, CSSCustomProperty>;

  constructor(csf: CustomStylesFile) {
    this.#properties = new Map();
    for (const prop of csf.cssCustomProperties) {
      this.#properties.set(prop.name, prop);
    }
  }

  getCSSCustomProperties(): CSSCustomPropertySummary[] {
    const summaries: CSSCustomPropertySummary[] = [];
    for (const prop of this.#properties.values()) {
      summaries.push({
        name: prop.name,
        description: prop.description,
        type: prop.type,
        tags: prop.tags
      });
    }
    return summaries.sort((left, right) => left.name.localeCompare(right.name));
  }

  getCSSCustomProperty(name: string): CSSCustomProperty | undefined {
    return this.#properties.get(name);
  }
}
