export const KindField = 'field';
export const KindMethod = 'method';

export interface Manifest {
  schemaVersion: string;
  readme?: string;
  modules: Module[];
}

export interface Module {
  kind: string;
  path: string;
  declarations?: Declaration[];
  exports?: Export[];
}

export interface Declaration {
  kind: string;
  name: string;
  summary?: string;
  description?: string;
  tagName?: string;
  deprecated?: string;
  superclass?: Reference;
  mixins?: Reference[];
  members?: Member[];
  attributes?: Attribute[];
  events?: Event[];
  slots?: Slot[];
  cssProperties?: CSSProperty[];
  cssParts?: CSSPart[];
  commands?: Command[];
  demos?: Demo[];
  customElement?: boolean;
}

export interface Reference {
  name: string;
  package?: string;
  module?: string;
}

export interface Member {
  kind: string;
  name: string;
  description?: string;
  type?: Type;
  default?: string;
  privacy?: string;
  static?: boolean;
  readonly?: boolean;
  inherited?: boolean;
  source?: Source;
  parameters?: Parameter[];
  return?: Return;
}

export interface Parameter {
  name: string;
  description?: string;
  type?: Type;
  default?: string;
  optional?: boolean;
  rest?: boolean;
}

export interface Return {
  type?: Type;
  description?: string;
}

export interface Attribute {
  name: string;
  description?: string;
  type?: Type;
  default?: string;
  fieldName?: string;
  reflects?: boolean;
  inherited?: boolean;
  deprecated?: string;
}

export interface Event {
  name: string;
  description?: string;
  type?: Type;
  inherited?: boolean;
  deprecated?: string;
}

export interface Slot {
  name: string;
  description?: string;
  deprecated?: string;
}

export interface CSSProperty {
  name: string;
  description?: string;
  default?: string;
  syntax?: string;
  deprecated?: string;
}

export interface CSSPart {
  name: string;
  description?: string;
  deprecated?: string;
}

export interface Command {
  name: string;
  description?: string;
  deprecated?: string;
}

export interface Type {
  text: string;
  references?: Reference[];
}

export interface Source {
  href?: string;
}

export interface Demo {
  url: string;
  description?: string;
}

export interface Export {
  kind: string;
  name: string;
  declaration?: ExportDeclaration;
}

export interface ExportDeclaration {
  name: string;
  module?: string;
  package?: string;
}
