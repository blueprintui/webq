import { describe, test, expect } from 'bun:test';
import { Store } from './store.js';
import { parseManifest } from './parser.js';
import { join } from 'path';

const testdataPath = join(import.meta.dir, '../../../testdata/custom-elements.json');

async function createTestStore() {
  const manifest = await parseManifest(testdataPath);
  return new Store(manifest);
}

describe('Store', () => {
  test('GetManifests returns original manifests', async () => {
    const store = await createTestStore();
    const manifests = store.getManifests();
    expect(manifests.length).toBe(1);
    expect(manifests[0].schemaVersion).toBe('1.0.0');
  });

  test('ListElements returns all elements sorted', async () => {
    const store = await createTestStore();
    const elements = store.listElements();
    expect(elements.length).toBe(4);
    expect(elements[0].tagName).toBe('bp-alert');
    expect(elements[1].tagName).toBe('bp-button');
    expect(elements[2].tagName).toBe('bp-card');
    expect(elements[3].tagName).toBe('bp-input');
  });

  test('GetElement returns element by tag name', async () => {
    const store = await createTestStore();
    const elem = store.getElement('bp-button');
    expect(elem).toBeDefined();
    expect(elem?.tagName).toBe('bp-button');
    expect(elem?.name).toBe('BpButton');
  });

  test('GetElement returns undefined for unknown', async () => {
    const store = await createTestStore();
    expect(store.getElement('bp-unknown')).toBeUndefined();
  });

  test('SearchElements finds by tag name', async () => {
    const store = await createTestStore();
    const results = store.searchElements('button');
    expect(results.length).toBe(1);
    expect(results[0].tagName).toBe('bp-button');
  });

  test('SearchElements finds by description', async () => {
    const store = await createTestStore();
    const results = store.searchElements('customizable');
    expect(results.length).toBeGreaterThan(0);
  });

  test('ListModules returns all modules sorted', async () => {
    const store = await createTestStore();
    const modules = store.listModules();
    expect(modules.length).toBe(4);
  });

  test('GetModule returns module by path', async () => {
    const store = await createTestStore();
    const module = store.getModule('src/button/button.js');
    expect(module).toBeDefined();
    expect(module?.path).toBe('src/button/button.js');
  });

  test('GetAttributes returns attributes for element', async () => {
    const store = await createTestStore();
    const attrs = store.getAttributes('bp-button');
    expect(attrs.length).toBeGreaterThan(0);
    expect(attrs.some(a => a.name === 'variant')).toBe(true);
  });

  test('GetProperties returns field members', async () => {
    const store = await createTestStore();
    const props = store.getProperties('bp-button');
    expect(props.length).toBeGreaterThan(0);
    expect(props.every(p => p.kind === 'field')).toBe(true);
  });

  test('GetMethods returns method members', async () => {
    const store = await createTestStore();
    const methods = store.getMethods('bp-button');
    expect(methods.length).toBeGreaterThan(0);
    expect(methods.every(m => m.kind === 'method')).toBe(true);
  });

  test('GetEvents returns events', async () => {
    const store = await createTestStore();
    const events = store.getEvents('bp-button');
    expect(events.length).toBeGreaterThan(0);
  });

  test('GetSlots returns slots', async () => {
    const store = await createTestStore();
    const slots = store.getSlots('bp-button');
    expect(slots.length).toBeGreaterThan(0);
  });

  test('GetCSSProperties returns CSS properties', async () => {
    const store = await createTestStore();
    const props = store.getCSSProperties('bp-button');
    expect(props.length).toBeGreaterThan(0);
  });

  test('GetCSSParts returns CSS parts', async () => {
    const store = await createTestStore();
    const parts = store.getCSSParts('bp-button');
    expect(parts.length).toBeGreaterThan(0);
  });

  test('GetElementSummaries returns sorted summaries', async () => {
    const store = await createTestStore();
    const summaries = store.getElementSummaries();
    expect(summaries.length).toBe(4);
    expect(summaries[0].tagName).toBe('bp-alert');
    expect(summaries[0].description).toBeDefined();
  });

  test('GetAttributes returns empty for unknown element', async () => {
    const store = await createTestStore();
    expect(store.getAttributes('bp-unknown')).toEqual([]);
  });
});
