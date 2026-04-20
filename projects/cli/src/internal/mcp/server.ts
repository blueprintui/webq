import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { Store } from '../elements/store.js';
import type { ValidateConfig } from '../validate/types.js';
import type { PatternStore } from '../patterns/store.js';
import type { CustomAttributeStore } from '../attributes/store.js';
import type { CustomStyleStore } from '../styles/store.js';
import type { ToolContext, ToolModule } from '../tools.js';
import '../validate/rules/index.js';

import * as elementList from '../elements/tools/list.js';
import * as elementGet from '../elements/tools/get.js';
import * as elementAttributes from '../elements/tools/attributes.js';
import * as elementProperties from '../elements/tools/properties.js';
import * as elementMethods from '../elements/tools/methods.js';
import * as elementEvents from '../elements/tools/events.js';
import * as elementSlots from '../elements/tools/slots.js';
import * as elementCommands from '../elements/tools/commands.js';
import * as elementCSSProperties from '../elements/tools/css-properties.js';
import * as elementCSSParts from '../elements/tools/css-parts.js';
import * as patternList from '../patterns/tools/list.js';
import * as patternGet from '../patterns/tools/get.js';
import * as attributeList from '../attributes/tools/list.js';
import * as attributeGet from '../attributes/tools/get.js';
import * as stylePropertyList from '../styles/tools/list.js';
import * as stylePropertyGet from '../styles/tools/get.js';
import * as validateHTML from '../validate/tools/validate-html.js';

export interface ServerConfig {
  store: Store;
  version: string;
  validateCfg?: ValidateConfig;
  patternStore?: PatternStore;
  customAttrStore?: CustomAttributeStore;
  customStyleStore?: CustomStyleStore;
}

const allTools: ToolModule[] = [
  elementList,
  elementGet,
  elementAttributes,
  elementProperties,
  elementMethods,
  elementEvents,
  elementSlots,
  elementCommands,
  elementCSSProperties,
  elementCSSParts,
  patternList,
  patternGet,
  attributeList,
  attributeGet,
  stylePropertyList,
  stylePropertyGet,
  validateHTML
];

export class Server {
  readonly #mcpServer: McpServer;
  readonly #ctx: ToolContext;

  constructor(cfg: ServerConfig) {
    this.#ctx = {
      store: cfg.store,
      patternStore: cfg.patternStore,
      customAttrStore: cfg.customAttrStore,
      customStyleStore: cfg.customStyleStore,
      validateCfg: cfg.validateCfg
    };

    this.#mcpServer = new McpServer({
      name: 'webq',
      version: cfg.version
    });

    this.#registerTools();
    this.#registerResources();
  }

  async serve(transport: Transport = new StdioServerTransport()): Promise<void> {
    await this.#mcpServer.connect(transport);
  }

  #registerTools(): void {
    for (const tool of allTools) {
      this.#mcpServer.registerTool(
        tool.metadata.toolName,
        {
          description: tool.metadata.description,
          inputSchema: tool.metadata.inputSchema,
          annotations: tool.metadata.annotations
        },
        async (input: Record<string, unknown>) => {
          try {
            const result = tool.toJSON(this.#ctx, input);
            return {
              content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
            };
          } catch (err) {
            return {
              content: [{ type: 'text' as const, text: (err as Error).message }],
              isError: true
            };
          }
        }
      );
    }
  }

  #registerResources(): void {
    this.#mcpServer.registerResource(
      'manifest',
      'webq://manifest',
      {
        description: 'Complete Web Query Manifests and Metadata',
        mimeType: 'application/json'
      },
      async uri => ({
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(this.#ctx.store.getManifests(), null, 2)
          }
        ]
      })
    );
  }
}
