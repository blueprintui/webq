import type { ZodType } from 'zod/v3';
import type { Store } from './elements/store.js';
import type { PatternStore } from './patterns/store.js';
import type { CustomAttributeStore } from './attributes/store.js';
import type { CustomStyleStore } from './styles/store.js';
import type { ValidateConfig } from './validate/types.js';

export interface ToolContext {
  store: Store;
  patternStore?: PatternStore;
  customAttrStore?: CustomAttributeStore;
  customStyleStore?: CustomStyleStore;
  validateCfg?: ValidateConfig;
}

interface ToolMetadata {
  command: string;
  toolName: string;
  summary: string;
  description: string;
  annotations: {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    openWorldHint: boolean;
  };
  inputSchema: ZodType;
}

export interface ToolModule {
  metadata: ToolMetadata;
  toJSON(ctx: ToolContext, input?: Record<string, unknown>): unknown;
  toMarkdown(ctx: ToolContext, input?: Record<string, unknown>): string;
}
