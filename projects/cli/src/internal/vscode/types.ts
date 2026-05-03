export interface HTMLCustomData {
  version: number;
  tags?: Tag[];
  globalAttributes?: TagAttribute[];
  valueSets?: ValueSet[];
}

export interface Tag {
  name: string;
  description?: Description | string;
  attributes?: TagAttribute[];
}

export interface TagAttribute {
  name: string;
  description?: Description | string;
  valueSet?: string;
  values?: Value[];
}

interface Description {
  text: string;
}

export function parseDescription(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (raw !== null && typeof raw === 'object' && 'value' in raw) return (raw as Record<string, string>).value;
  if (raw !== null && typeof raw === 'object' && 'text' in raw) return (raw as Record<string, string>).text;
  return '';
}

export interface Value {
  name: string;
  description?: Description | string;
}

export interface ValueSet {
  name: string;
  values?: Value[];
}

export interface CSSCustomData {
  version: number;
  properties?: CSSProperty[];
}

interface CSSProperty {
  name: string;
  description?: Description | string;
}
