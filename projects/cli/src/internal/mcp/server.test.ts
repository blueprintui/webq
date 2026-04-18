import { describe, test, expect } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Server } from './server.js';
import { Store } from '../elements/store.js';
import { parseManifestFromString } from '../elements/parser.js';

const manifestJSON = `{
  "schemaVersion": "1.0.0",
  "modules": [{
    "kind": "javascript-module",
    "path": "src/button.js",
    "declarations": [{
      "kind": "class", "name": "BpButton", "tagName": "bp-button", "customElement": true,
      "attributes": [{ "name": "variant", "type": { "text": "'primary' | 'secondary'" } }],
      "events": [{ "name": "bp-click", "type": { "text": "CustomEvent" } }],
      "slots": [{ "name": "" }],
      "cssProperties": [],
      "cssParts": [],
      "commands": []
    }]
  }]
}`;

async function connectServerClient(): Promise<{ client: Client; close: () => Promise<void> }> {
  const store = new Store(parseManifestFromString(manifestJSON));
  const server = new Server({ store, version: '0.0.0-test' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  await Promise.all([server.serve(serverTransport), client.connect(clientTransport)]);
  return {
    client,
    close: async () => {
      await client.close();
    }
  };
}

describe('MCP Server', () => {
  test('registers all tools from allTools list', async () => {
    const { client, close } = await connectServerClient();
    try {
      const result = await client.listTools();
      const names = result.tools.map(t => t.name).sort();
      expect(names).toEqual(
        [
          'element_get_list',
          'element_get',
          'element_get_attributes',
          'element_get_properties',
          'element_get_methods',
          'element_get_events',
          'element_get_slots',
          'element_get_commands',
          'element_get_css_properties',
          'element_get_css_parts',
          'pattern_get_list',
          'pattern_get',
          'attribute_get_list',
          'attribute_get',
          'style_property_list',
          'style_property_get',
          'validate_html'
        ].sort()
      );
    } finally {
      await close();
    }
  });

  test('tool metadata includes description and annotations', async () => {
    const { client, close } = await connectServerClient();
    try {
      const result = await client.listTools();
      const elementGet = result.tools.find(t => t.name === 'element_get');
      if (!elementGet) throw new Error('element_get tool not registered');
      expect(elementGet.description).toMatch(/custom element/i);
      expect(elementGet.annotations?.readOnlyHint).toBe(true);
      expect(elementGet.annotations?.destructiveHint).toBe(false);
    } finally {
      await close();
    }
  });

  test('callTool returns tool output for valid input', async () => {
    const { client, close } = await connectServerClient();
    try {
      const result = await client.callTool({
        name: 'element_get',
        arguments: { tagName: 'bp-button' }
      });
      expect(result.isError).toBeFalsy();
      const content = result.content as Array<{ type: string; text: string }>;
      expect(content).toHaveLength(1);
      expect(content[0].type).toBe('text');
      const parsed = JSON.parse(content[0].text);
      expect(parsed.tagName).toBe('bp-button');
    } finally {
      await close();
    }
  });

  test('callTool surfaces handler errors via isError', async () => {
    const { client, close } = await connectServerClient();
    try {
      const result = await client.callTool({
        name: 'element_get',
        arguments: { tagName: 'does-not-exist' }
      });
      expect(result.isError).toBe(true);
      const content = result.content as Array<{ type: string; text: string }>;
      expect(content[0].text).toMatch(/does-not-exist/);
    } finally {
      await close();
    }
  });

  test('callTool with invalid input returns isError', async () => {
    const { client, close } = await connectServerClient();
    try {
      const result = await client.callTool({ name: 'element_get', arguments: {} });
      expect(result.isError).toBe(true);
    } finally {
      await close();
    }
  });

  test('validate_html tool runs against the store', async () => {
    const { client, close } = await connectServerClient();
    try {
      const result = await client.callTool({
        name: 'validate_html',
        arguments: { html: '<bp-button unknown-attr="x">Click</bp-button>' }
      });
      expect(result.isError).toBeFalsy();
      const content = result.content as Array<{ type: string; text: string }>;
      const parsed = JSON.parse(content[0].text) as {
        errorCount: number;
        messages: Array<{ ruleId: string }>;
      };
      expect(parsed.errorCount).toBeGreaterThan(0);
      expect(parsed.messages.some(m => m.ruleId === 'no-unknown-attr')).toBe(true);
    } finally {
      await close();
    }
  });

  test('registers webq://manifest resource', async () => {
    const { client, close } = await connectServerClient();
    try {
      const list = await client.listResources();
      const manifestResource = list.resources.find(r => r.uri === 'webq://manifest');
      if (!manifestResource) throw new Error('webq://manifest resource not registered');
      expect(manifestResource.mimeType).toBe('application/json');
    } finally {
      await close();
    }
  });

  test('reads webq://manifest resource and returns store manifests', async () => {
    const { client, close } = await connectServerClient();
    try {
      const result = await client.readResource({ uri: 'webq://manifest' });
      expect(result.contents).toHaveLength(1);
      const entry = result.contents[0] as { uri: string; mimeType?: string; text: string };
      expect(entry.uri).toBe('webq://manifest');
      expect(entry.mimeType).toBe('application/json');
      const parsed = JSON.parse(entry.text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].modules[0].declarations[0].tagName).toBe('bp-button');
    } finally {
      await close();
    }
  });
});
