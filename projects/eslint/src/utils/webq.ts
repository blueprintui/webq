import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  verify,
  allRules,
  Store,
  PatternStore,
  CustomAttributeStore,
  CustomStyleStore,
  normalizePatternsFile,
  normalizeCustomAttributesFile
} from '@webq/cli/validate';
import type { Manifest, LintMessage } from '@webq/cli/validate';

export type WebqMessage = LintMessage;

interface StoreContext {
  store: Store;
  patternStore?: PatternStore;
  customAttributeStore?: CustomAttributeStore;
  customStyleStore?: CustomStyleStore;
}

const cache = new Map<string, WebqMessage[]>();
const storeCache = new Map<string, StoreContext>();

export function clearCache() {
  cache.clear();
}

/** @internal Overridable for testing. */
export const _internals = {
  validate: validateInProcess
};

export function runWebqValidation(html: string, path: string): WebqMessage[] {
  const key = `${path}\0${html}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const messages = _internals.validate(html, path);
  cache.set(key, messages);
  return messages;
}

function validateInProcess(html: string, path: string): WebqMessage[] {
  const ctx = getOrCreateStoreContext(path);
  const result = verify(html, ctx.store, allRules(), {
    stores: {
      patternStore: ctx.patternStore,
      customStyleStore: ctx.customStyleStore,
      customAttributeStore: ctx.customAttributeStore
    }
  });
  return result.messages;
}

const skipDirs = new Set(['.wireit', '.git', '.cache', '.turbo', '.nx', '.parcel-cache', 'node_modules']);

function getOrCreateStoreContext(path: string): StoreContext {
  const cached = storeCache.get(path);
  if (cached) return cached;

  const manifestPaths = resolvePathsSync(path);
  const manifests = manifestPaths.map(p => JSON.parse(readFileSync(p, 'utf-8')) as Manifest);
  const store = new Store(...manifests);

  const patternStore = loadOptionalStore(path, 'custom-patterns.json', data => {
    return new PatternStore(normalizePatternsFile(JSON.parse(data)));
  });

  const customAttributeStore = loadOptionalStore(path, 'custom-attributes.json', data => {
    return new CustomAttributeStore(normalizeCustomAttributesFile(JSON.parse(data)));
  });

  const customStyleStore = loadOptionalStore(path, 'custom-styles.json', data => {
    return new CustomStyleStore(JSON.parse(data));
  });

  const ctx: StoreContext = { store, patternStore, customAttributeStore, customStyleStore };
  storeCache.set(path, ctx);
  return ctx;
}

function resolvePathsSync(pathsStr: string): string[] {
  if (!pathsStr) return [];
  const result: string[] = [];
  for (let p of pathsStr.split(',')) {
    p = p.trim();
    if (!p) continue;
    walkSync(p, 'custom-elements.json', result);
  }
  return result;
}

function walkSync(dir: string, filename: string, results: string[]): void {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) walkSync(fullPath, filename, results);
    } else if (entry.name === filename) {
      results.push(fullPath);
    }
  }
}

function loadOptionalStore<T>(basePath: string, filename: string, create: (data: string) => T): T | undefined {
  const results: string[] = [];
  for (let p of basePath.split(',')) {
    p = p.trim();
    if (!p) continue;
    walkSync(p, filename, results);
  }
  if (results.length === 0) return undefined;
  return create(readFileSync(results[0], 'utf-8'));
}
