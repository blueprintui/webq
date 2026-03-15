import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import type { Store } from '../elements/store.js';
import type { ValidateConfig } from '../validate/types.js';
import type { PatternStore } from '../patterns/store.js';
import type { CustomAttributeStore } from '../attributes/store.js';
import type { CustomStyleStore } from '../styles/store.js';
import '../validate/rules/index.js';
import * as tools from './tools.js';

export interface ServerConfig {
  store: Store;
  version: string;
  validateCfg?: ValidateConfig;
  patternStore?: PatternStore;
  customAttrStore?: CustomAttributeStore;
  customStyleStore?: CustomStyleStore;
}

const readOnlyAnnotations = {
  readOnlyHint: true as const,
  destructiveHint: false as const,
  openWorldHint: false as const
};

export class Server {
  #mcpServer: McpServer;
  #store: Store;
  #validateCfg?: ValidateConfig;
  #patternStore?: PatternStore;
  #customAttrStore?: CustomAttributeStore;
  #customStyleStore?: CustomStyleStore;

  constructor(cfg: ServerConfig) {
    this.#store = cfg.store;
    this.#validateCfg = cfg.validateCfg;
    this.#patternStore = cfg.patternStore;
    this.#customAttrStore = cfg.customAttrStore;
    this.#customStyleStore = cfg.customStyleStore;

    this.#mcpServer = new McpServer({
      name: 'webq',
      version: cfg.version
    });

    this.#registerTools();
    this.#registerResources();
  }

  async serve(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.#mcpServer.connect(transport);
  }

  #registerTools(): void {
    this.#mcpServer.registerTool(
      'element_get_list',
      {
        description:
          'List all custom elements with their tag names. Use this first to discover available components before querying specific elements.',
        inputSchema: {},
        annotations: readOnlyAnnotations
      },
      async () => {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(tools.handleListElements(this.#store), null, 2)
            }
          ]
        };
      }
    );

    this.#mcpServer.registerTool(
      'element_get',
      {
        description:
          'Get full details for a specific custom element including attributes, properties, methods, events, slots, commands, CSS properties, and CSS parts.',
        inputSchema: {
          tagName: z.string().describe("The tag name of the custom element (e.g. 'my-button')")
        },
        annotations: readOnlyAnnotations
      },
      async ({ tagName }) => {
        const result = tools.handleGetElement(this.#store, tagName);
        if (typeof result === 'string')
          return {
            content: [{ type: 'text' as const, text: result }],
            isError: true
          };
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
        };
      }
    );

    this.#mcpServer.registerTool(
      'element_get_attributes',
      {
        description: 'Get HTML attributes for a custom element.',
        inputSchema: { tagName: z.string() },
        annotations: readOnlyAnnotations
      },
      async ({ tagName }) => {
        const result = tools.handleGetAttributes(this.#store, tagName);
        if (typeof result === 'string')
          return {
            content: [{ type: 'text' as const, text: result }],
            isError: true
          };
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
        };
      }
    );

    this.#mcpServer.registerTool(
      'element_get_properties',
      {
        description: 'Get JavaScript properties (fields) for a custom element.',
        inputSchema: { tagName: z.string() },
        annotations: readOnlyAnnotations
      },
      async ({ tagName }) => {
        const result = tools.handleGetProperties(this.#store, tagName);
        if (typeof result === 'string')
          return {
            content: [{ type: 'text' as const, text: result }],
            isError: true
          };
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
        };
      }
    );

    this.#mcpServer.registerTool(
      'element_get_methods',
      {
        description: 'Get methods for a custom element.',
        inputSchema: { tagName: z.string() },
        annotations: readOnlyAnnotations
      },
      async ({ tagName }) => {
        const result = tools.handleGetMethods(this.#store, tagName);
        if (typeof result === 'string')
          return {
            content: [{ type: 'text' as const, text: result }],
            isError: true
          };
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
        };
      }
    );

    this.#mcpServer.registerTool(
      'element_get_events',
      {
        description: 'Get events that a custom element can fire.',
        inputSchema: { tagName: z.string() },
        annotations: readOnlyAnnotations
      },
      async ({ tagName }) => {
        const result = tools.handleGetEvents(this.#store, tagName);
        if (typeof result === 'string')
          return {
            content: [{ type: 'text' as const, text: result }],
            isError: true
          };
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
        };
      }
    );

    this.#mcpServer.registerTool(
      'element_get_slots',
      {
        description: "Get slots available in a custom element's shadow DOM.",
        inputSchema: { tagName: z.string() },
        annotations: readOnlyAnnotations
      },
      async ({ tagName }) => {
        const result = tools.handleGetSlots(this.#store, tagName);
        if (typeof result === 'string')
          return {
            content: [{ type: 'text' as const, text: result }],
            isError: true
          };
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
        };
      }
    );

    this.#mcpServer.registerTool(
      'element_get_commands',
      {
        description: 'Get invoker commands for a custom element.',
        inputSchema: { tagName: z.string() },
        annotations: readOnlyAnnotations
      },
      async ({ tagName }) => {
        const result = tools.handleGetCommands(this.#store, tagName);
        if (typeof result === 'string')
          return {
            content: [{ type: 'text' as const, text: result }],
            isError: true
          };
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
        };
      }
    );

    this.#mcpServer.registerTool(
      'element_get_css_properties',
      {
        description: 'Get CSS custom properties (CSS variables) for a custom element.',
        inputSchema: { tagName: z.string() },
        annotations: readOnlyAnnotations
      },
      async ({ tagName }) => {
        const result = tools.handleGetCSSProperties(this.#store, tagName);
        if (typeof result === 'string')
          return {
            content: [{ type: 'text' as const, text: result }],
            isError: true
          };
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
        };
      }
    );

    this.#mcpServer.registerTool(
      'element_get_css_parts',
      {
        description: 'Get CSS parts exposed by a custom element for styling via ::part() selector.',
        inputSchema: { tagName: z.string() },
        annotations: readOnlyAnnotations
      },
      async ({ tagName }) => {
        const result = tools.handleGetCSSParts(this.#store, tagName);
        if (typeof result === 'string')
          return {
            content: [{ type: 'text' as const, text: result }],
            isError: true
          };
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
        };
      }
    );

    this.#mcpServer.registerTool(
      'validate_html',
      {
        description:
          'Validate an HTML string against the Custom Elements Manifest. Returns ESLint-compatible lint results.',
        inputSchema: { html: z.string(), rule: z.string().optional() },
        annotations: readOnlyAnnotations
      },
      async ({ html, rule }) => {
        const result = tools.handleValidateHTML(
          html,
          this.#store,
          this.#validateCfg,
          this.#patternStore,
          this.#customStyleStore,
          this.#customAttrStore,
          rule
        );
        if (typeof result === 'string')
          return {
            content: [{ type: 'text' as const, text: result }],
            isError: true
          };
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
        };
      }
    );

    this.#mcpServer.registerTool(
      'pattern_get_list',
      {
        description: 'List all compositional patterns.',
        inputSchema: {},
        annotations: readOnlyAnnotations
      },
      async () => {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(tools.handleListPatterns(this.#patternStore), null, 2)
            }
          ]
        };
      }
    );

    this.#mcpServer.registerTool(
      'pattern_get',
      {
        description: 'Get full details for a compositional pattern including structural rules and HTML examples.',
        inputSchema: { name: z.string() },
        annotations: readOnlyAnnotations
      },
      async ({ name }) => {
        const result = tools.handleGetPattern(this.#patternStore, name);
        if (typeof result === 'string')
          return {
            content: [{ type: 'text' as const, text: result }],
            isError: true
          };
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
        };
      }
    );

    this.#mcpServer.registerTool(
      'attribute_get_list',
      {
        description: 'List all custom attributes.',
        inputSchema: {},
        annotations: readOnlyAnnotations
      },
      async () => {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(tools.handleListCustomAttributes(this.#customAttrStore), null, 2)
            }
          ]
        };
      }
    );

    this.#mcpServer.registerTool(
      'attribute_get',
      {
        description: 'Get full details for a custom attribute including token groups, values, and HTML examples.',
        inputSchema: { name: z.string() },
        annotations: readOnlyAnnotations
      },
      async ({ name }) => {
        const result = tools.handleGetCustomAttribute(this.#customAttrStore, name);
        if (typeof result === 'string')
          return {
            content: [{ type: 'text' as const, text: result }],
            isError: true
          };
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
        };
      }
    );

    this.#mcpServer.registerTool(
      'style_property_list',
      {
        description: 'List all CSS custom properties defined in custom styles.',
        inputSchema: {},
        annotations: readOnlyAnnotations
      },
      async () => {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(tools.handleListCustomStyles(this.#customStyleStore), null, 2)
            }
          ]
        };
      }
    );

    this.#mcpServer.registerTool(
      'style_property_get',
      {
        description: 'Get full details for a CSS custom property from custom styles.',
        inputSchema: { name: z.string() },
        annotations: readOnlyAnnotations
      },
      async ({ name }) => {
        const result = tools.handleGetCustomStyle(this.#customStyleStore, name);
        if (typeof result === 'string')
          return {
            content: [{ type: 'text' as const, text: result }],
            isError: true
          };
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
        };
      }
    );
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
            text: JSON.stringify(this.#store.getManifests(), null, 2)
          }
        ]
      })
    );
  }
}
