export interface CustomAttributesFile {
  schemaVersion: string;
  attributes: CustomAttribute[];
}

export interface CustomAttribute {
  name: string;
  description: string;
  syntax?: string;
  appliesTo?: AppliesTo;
  tokenGroups?: TokenGroup[];
  values?: TokenValue[];
  examples?: Example[];
  tags?: string[];
}

export interface AppliesTo {
  all: boolean;
  elements: string[];
}

export function parseAppliesTo(raw: unknown): AppliesTo {
  if (raw === '*') return { all: true, elements: [] };
  if (Array.isArray(raw)) return { all: false, elements: raw as string[] };
  if (raw !== null && typeof raw === 'object' && 'all' in raw) return raw as AppliesTo;
  return { all: false, elements: [] };
}

export interface TokenGroup {
  name: string;
  description?: string;
  rule?: string;
  required?: boolean;
  requires?: string[];
  values?: TokenValue[];
}

export interface TokenValue {
  value: string;
  description?: string;
}

export function parseTokenValue(raw: unknown): TokenValue {
  if (typeof raw === 'string') return { value: raw };
  return raw as TokenValue;
}

export interface Example {
  name: string;
  description?: string;
  html: string;
}
