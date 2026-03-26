import { readFile } from 'fs/promises';
import type { CustomAttributesFile } from './types.js';
import { parseAppliesTo, parseTokenValue } from './types.js';

export async function parseCustomAttributes(path: string): Promise<CustomAttributesFile> {
  const data = await readFile(path, 'utf-8');
  const raw = JSON.parse(data);
  return normalizeCustomAttributesFile(raw);
}

function normalizeCustomAttributesFile(raw: unknown): CustomAttributesFile {
  const caf = raw as CustomAttributesFile;
  if (caf.attributes) {
    for (const attr of caf.attributes) {
      if (attr.appliesTo !== undefined) {
        attr.appliesTo = parseAppliesTo(attr.appliesTo);
      } else {
        attr.appliesTo = { all: false, elements: [] };
      }
      if (attr.values) {
        attr.values = attr.values.map((v: unknown) => parseTokenValue(v));
      }
      if (attr.tokenGroups) {
        for (const tg of attr.tokenGroups) {
          if (tg.values) {
            tg.values = tg.values.map((v: unknown) => parseTokenValue(v));
          }
        }
      }
    }
  }
  return caf;
}
