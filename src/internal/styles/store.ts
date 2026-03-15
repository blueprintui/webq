import type { CSSCustomProperty, CustomStylesFile } from './types.js';

export interface CSSCustomPropertySummary {
  name: string;
  description?: string;
  type?: string;
  tags?: string[];
}

export class CustomStyleStore {
  #properties: Map<string, CSSCustomProperty> = new Map();

  constructor(csf: CustomStylesFile) {
    for (const p of csf.cssCustomProperties) {
      this.#properties.set(p.name, p);
    }
  }

  getCSSCustomProperties(): CSSCustomPropertySummary[] {
    const summaries: CSSCustomPropertySummary[] = [];
    for (const p of this.#properties.values()) {
      summaries.push({
        name: p.name,
        description: p.description,
        type: p.type,
        tags: p.tags
      });
    }
    return summaries.sort((a, b) => a.name.localeCompare(b.name));
  }

  getCSSCustomProperty(name: string): CSSCustomProperty | undefined {
    return this.#properties.get(name);
  }
}
