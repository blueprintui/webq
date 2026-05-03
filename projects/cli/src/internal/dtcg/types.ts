export interface DTCGFile {
  [key: string]: DTCGNode;
}

export type DTCGNode = DTCGToken | DTCGGroup;

interface DTCGToken {
  $value: string | number | boolean | object;
  $type?: string;
  $description?: string;
  $extensions?: Record<string, unknown>;
}

interface DTCGGroup {
  $type?: string;
  $description?: string;
  [key: string]: DTCGNode | string | undefined;
}
