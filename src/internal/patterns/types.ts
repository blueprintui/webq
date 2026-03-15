export interface PatternsFile {
  schemaVersion: string;
  patterns: Pattern[];
}

export interface Pattern {
  name: string;
  description: string;
  tags?: string[];
  structure: Structure;
  examples?: Example[];
  relatedPatterns?: string[];
}

export interface Structure {
  root?: ElementRef;
  children?: ChildRule[];
  siblings?: SiblingRule[];
}

export interface ElementRef {
  tag: string;
  attributes?: AttributeRule[];
  slot?: string;
}

export function parseElementRef(raw: unknown): ElementRef | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === 'string') return { tag: raw };
  return raw as ElementRef;
}

export interface ChildRule {
  rule: string;
  element?: ElementRef;
  options?: ElementRef[];
  description?: string;
}

export interface SiblingRule {
  description?: string;
  trigger: ElementRef;
  target: ElementRef;
  bindings?: AttributeBinding[];
}

export interface AttributeRule {
  name: string;
  required?: boolean;
  value?: string;
}

export interface AttributeBinding {
  triggerAttribute: string;
  targetAttribute: string;
}

export interface Example {
  name: string;
  description?: string;
  html: string;
}
