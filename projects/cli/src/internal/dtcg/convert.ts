import type { DTCGFile, DTCGNode } from './types.js';
import type { CustomStylesFile, CSSCustomProperty } from '../styles/types.js';

export function convertDTCG(data: DTCGFile): CustomStylesFile {
  const properties: CSSCustomProperty[] = [];
  walk(data, properties, [], undefined);
  return { schemaVersion: '1.0.0', cssCustomProperties: properties };
}

function isToken(node: unknown): boolean {
  return node !== null && typeof node === 'object' && '$value' in (node as Record<string, unknown>);
}

function walk(
  node: Record<string, unknown>,
  properties: CSSCustomProperty[],
  path: string[],
  inheritedType: string | undefined
): void {
  for (const key of Object.keys(node)) {
    if (key.startsWith('$')) continue;

    const child = node[key] as DTCGNode;
    if (child === null || typeof child !== 'object') continue;

    const childPath = [...path, key];

    if (isToken(child)) {
      const token = child as { $value: unknown; $type?: string; $description?: string };
      const name = '--' + childPath.join('-');
      const value = typeof token.$value === 'string' ? token.$value : String(token.$value);
      const type = token.$type ?? inheritedType;
      const tags = path.length > 0 ? [...path] : [];

      const prop: CSSCustomProperty = { name, value };
      if (type) prop.type = type;
      if (token.$description) prop.description = token.$description;
      if (tags.length > 0) prop.tags = tags;

      properties.push(prop);
    } else {
      const group = child as Record<string, unknown>;
      const groupType = (group.$type as string | undefined) ?? inheritedType;
      walk(group, properties, childPath, groupType);
    }
  }
}
