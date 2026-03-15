import type { Manifest, Declaration, Attribute } from '../elements/types.js';
import type { CustomAttributesFile, CustomAttribute } from '../attributes/types.js';
import type { CustomStylesFile, CSSCustomProperty } from '../styles/types.js';
import type { HTMLCustomData, TagAttribute, Value, ValueSet } from './types.js';
import type { CSSCustomData } from './types.js';
import { parseDescription } from './types.js';
import { isCustomElement } from '../validate/schema.js';

export function convertHTML(data: HTMLCustomData): {
  manifest: Manifest | undefined;
  attributes: CustomAttributesFile | undefined;
} {
  const valueSets = buildValueSetMap(data.valueSets ?? []);

  const declarations: Declaration[] = [];
  for (const tag of data.tags ?? []) {
    if (!isCustomElement(tag.name)) continue;

    const attrs: Attribute[] = [];
    for (const a of tag.attributes ?? []) {
      const attr: Attribute = {
        name: a.name,
        description: parseDescription(a.description)
      };
      const typeText = resolveTypeText(a, valueSets);
      if (typeText) {
        attr.type = { text: typeText };
      }
      attrs.push(attr);
    }

    declarations.push({
      kind: 'class',
      name: tag.name,
      description: parseDescription(tag.description),
      tagName: tag.name,
      customElement: true,
      attributes: attrs
    });
  }

  let manifest: Manifest | undefined;
  if (declarations.length > 0) {
    manifest = {
      schemaVersion: '2.0.0',
      modules: [
        {
          kind: 'javascript-module',
          path: 'vscode-custom-data',
          declarations
        }
      ]
    };
  }

  let caf: CustomAttributesFile | undefined;
  if (data.globalAttributes && data.globalAttributes.length > 0) {
    const customAttrs: CustomAttribute[] = [];
    for (const ga of data.globalAttributes) {
      const ca: CustomAttribute = {
        name: ga.name,
        description: parseDescription(ga.description),
        appliesTo: { all: true, elements: [] }
      };

      const values = resolveValues(ga, valueSets);
      if (values.length > 0) {
        ca.syntax = 'enum';
        ca.values = values.map(v => ({
          value: v.name,
          description: parseDescription(v.description)
        }));
      } else {
        ca.syntax = 'string';
      }

      customAttrs.push(ca);
    }
    caf = {
      schemaVersion: '1.0.0',
      attributes: customAttrs
    };
  }

  return { manifest, attributes: caf };
}

export function convertCSS(data: CSSCustomData): CustomStylesFile | undefined {
  const props: CSSCustomProperty[] = [];
  for (const p of data.properties ?? []) {
    if (!p.name.startsWith('--')) continue;
    props.push({
      name: p.name,
      description: parseDescription(p.description)
    });
  }

  if (props.length === 0) return undefined;

  return {
    schemaVersion: '1.0.0',
    cssCustomProperties: props
  };
}

function buildValueSetMap(valueSets: ValueSet[]): Map<string, Value[]> {
  const m = new Map<string, Value[]>();
  for (const vs of valueSets) {
    m.set(vs.name, vs.values ?? []);
  }
  return m;
}

function resolveValues(attr: TagAttribute, valueSets: Map<string, Value[]>): Value[] {
  if (attr.values && attr.values.length > 0) return attr.values;
  if (attr.valueSet) return valueSets.get(attr.valueSet) ?? [];
  return [];
}

function resolveTypeText(attr: TagAttribute, valueSets: Map<string, Value[]>): string {
  const values = resolveValues(attr, valueSets);
  if (values.length === 0) return '';
  return values.map(v => `'${v.name}'`).join(' | ');
}
