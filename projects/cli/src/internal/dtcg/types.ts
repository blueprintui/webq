export interface DTCGFile {
  [key: string]: DTCGNode;
}

export type DTCGNode = DTCGToken | DTCGGroup;

export interface DTCGToken {
  $value: string | number | boolean | object;
  $type?: string;
  $description?: string;
  $extensions?: Record<string, unknown>;
}

export interface DTCGGroup {
  $type?: string;
  $description?: string;
  [key: string]: DTCGNode | string | undefined;
}
