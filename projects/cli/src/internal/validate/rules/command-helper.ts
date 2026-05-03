import type { Store } from '../../elements/store.js';
import type { Declaration } from '../../elements/types.js';
import type { HTMLDocument, HTMLElement, HTMLAttribute } from '../types.js';
import { isCustomElement } from '../schema.js';

interface CommandPair {
  commandAttr: HTMLAttribute;
  targetTag: string;
  declaration: Declaration;
}

export function resolveCommandPairs(doc: HTMLDocument, store: Store): CommandPair[] {
  const idMap = buildIdMap(doc);

  const pairs: CommandPair[] = [];
  for (const elem of doc.elements) {
    const pair = resolvePair(elem, idMap, store);
    if (pair) pairs.push(pair);
  }
  return pairs;
}

function buildIdMap(doc: HTMLDocument): Map<string, HTMLElement> {
  const idMap = new Map<string, HTMLElement>();
  for (const elem of doc.elements) {
    for (const attr of elem.attributes) {
      if (attr.name === 'id' && attr.hasValue) {
        idMap.set(attr.value, elem);
      }
    }
  }
  return idMap;
}

function resolvePair(elem: HTMLElement, idMap: Map<string, HTMLElement>, store: Store): CommandPair | undefined {
  const { commandAttr, commandForAttr } = findCommandAttrs(elem);
  if (!commandAttr || !commandForAttr) return undefined;

  const targetElem = idMap.get(commandForAttr.value);
  if (!targetElem || !isCustomElement(targetElem.tagName)) return undefined;

  const decl = store.getElement(targetElem.tagName);
  if (!decl) return undefined;

  return {
    commandAttr,
    targetTag: targetElem.tagName,
    declaration: decl
  };
}

function findCommandAttrs(elem: HTMLElement): {
  commandAttr?: HTMLAttribute;
  commandForAttr?: HTMLAttribute;
} {
  let commandAttr: HTMLAttribute | undefined;
  let commandForAttr: HTMLAttribute | undefined;
  for (const attr of elem.attributes) {
    if (attr.name === 'command') commandAttr = attr;
    if (attr.name === 'commandfor') commandForAttr = attr;
  }
  return { commandAttr, commandForAttr };
}
