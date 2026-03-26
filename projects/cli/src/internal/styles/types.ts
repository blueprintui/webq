export interface CustomStylesFile {
  schemaVersion: string;
  cssCustomProperties: CSSCustomProperty[];
}

export interface CSSCustomProperty {
  name: string;
  value?: string;
  type?: string;
  description?: string;
  tags?: string[];
}
