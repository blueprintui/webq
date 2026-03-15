import type { Store } from '../../elements/store.js';
import type { Declaration } from '../../elements/types.js';
import type { HTMLDocument, HTMLElement, HTMLAttribute } from '../types.js';
import { isCustomElement } from '../schema.js';

export interface CommandPair {
  commandAttr: HTMLAttribute;
  targetTag: string;
  declaration: Declaration;
}

export function resolveCommandPairs(doc: HTMLDocument, store: Store): CommandPair[] {
  // First pass: collect id → element mappings
  const idMap = new Map<string, HTMLElement>();
  for (const elem of doc.elements) {
    for (const attr of elem.attributes) {
      if (attr.name === 'id' && attr.hasValue) {
        idMap.set(attr.value, elem);
      }
    }
  }

  // Second pass: resolve command/commandfor pairs
  const pairs: CommandPair[] = [];
  for (const elem of doc.elements) {
    let commandAttr: HTMLAttribute | undefined;
    let commandForAttr: HTMLAttribute | undefined;
    for (const attr of elem.attributes) {
      if (attr.name === 'command') commandAttr = attr;
      if (attr.name === 'commandfor') commandForAttr = attr;
    }

    if (!commandAttr || !commandForAttr) continue;

    const targetElem = idMap.get(commandForAttr.value);
    if (!targetElem || !isCustomElement(targetElem.tagName)) continue;

    const decl = store.getElement(targetElem.tagName);
    if (!decl) continue;

    pairs.push({
      commandAttr,
      targetTag: targetElem.tagName,
      declaration: decl
    });
  }

  return pairs;
}
