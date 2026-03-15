import { Store } from '../internal/elements/store.js';
import { parseManifest, resolvePaths } from '../internal/elements/index.js';
import { ErrElementNotFound } from '../internal/elements/errors.js';
import { load as loadConfigFile } from '../internal/config/config.js';
import { parseSeverity } from '../internal/config/config.js';
import type { Config } from '../internal/config/config.js';
import { PatternStore } from '../internal/patterns/store.js';
import { parsePatterns } from '../internal/patterns/parser.js';
import { resolve as resolvePatterns } from '../internal/patterns/resolver.js';
import { CustomAttributeStore } from '../internal/attributes/store.js';
import { parseCustomAttributes } from '../internal/attributes/parser.js';
import { resolve as resolveAttributes } from '../internal/attributes/resolver.js';
import { CustomStyleStore } from '../internal/styles/store.js';
import { parseCustomStyles } from '../internal/styles/parser.js';
import { resolve as resolveStyles } from '../internal/styles/resolver.js';
import { load as loadVSCode } from '../internal/vscode/load.js';
import type { VSCodeResult } from '../internal/vscode/load.js';
import type { Manifest, Declaration } from '../internal/elements/types.js';
import type { ValidateConfig } from '../internal/validate/types.js';

const errPathRequired = '--path flag, webq.config.json, or WEBQ_PATH environment variable is required';
const errNoManifestsFound = 'no custom-elements.json files found in provided paths';

export async function loadConfig(configFlag?: string): Promise<Config> {
  return loadConfigFile(configFlag || undefined);
}

export function resolvedPath(cfg: Config, pathFlag?: string): string {
  if (pathFlag) return pathFlag;
  if (cfg.global.path.length > 0) return cfg.global.path.join(',');
  return process.env.WEBQ_PATH ?? '';
}

export async function parseManifestsFromPath(path: string): Promise<Manifest[]> {
  if (!path) throw new Error(errPathRequired);

  const manifestPaths = await resolvePaths(path);
  if (manifestPaths.length === 0) throw new Error(errNoManifestsFound);

  const manifests: Manifest[] = [];
  for (const p of manifestPaths) {
    manifests.push(await parseManifest(p));
  }
  return manifests;
}

export async function createStoreFromConfig(cfg: Config, pathFlag?: string): Promise<Store> {
  const manifests = await parseManifestsFromPath(resolvedPath(cfg, pathFlag));

  const vscodeData = await loadVSCodeData(cfg, pathFlag);
  if (vscodeData) {
    manifests.push(...vscodeData.manifests);
  }

  return new Store(...manifests);
}

export async function createStore(pathFlag?: string, configFlag?: string): Promise<Store> {
  const cfg = await loadConfig(configFlag);
  return createStoreFromConfig(cfg, pathFlag);
}

export function getElementOrError(store: Store, tagName: string): Declaration {
  const element = store.getElement(tagName);
  if (!element) throw new ErrElementNotFound(tagName);
  return element;
}

export function printJSON(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

async function discoverOptionalFile(
  cfg: Config,
  resolveFn: (path: string) => Promise<string>,
  pathFlag?: string
): Promise<string> {
  const path = resolvedPath(cfg, pathFlag);
  if (!path) return '';

  for (let p of path.split(',')) {
    p = p.trim();
    if (!p) continue;
    const resolved = await resolveFn(p);
    if (resolved) return resolved;
  }

  return '';
}

export async function loadPatternsStore(cfg: Config, pathFlag?: string): Promise<PatternStore | undefined> {
  let path = cfg.global.patternsPath ?? '';
  if (!path) {
    path = await discoverOptionalFile(cfg, resolvePatterns, pathFlag);
  }
  if (!path) return undefined;

  const pf = await parsePatterns(path);
  return new PatternStore(pf);
}

export async function loadCustomAttributesStore(
  cfg: Config,
  pathFlag?: string
): Promise<CustomAttributeStore | undefined> {
  let caf;

  let path = cfg.global.attributesPath ?? '';
  if (!path) {
    path = await discoverOptionalFile(cfg, resolveAttributes, pathFlag);
  }
  if (path) {
    caf = await parseCustomAttributes(path);
  }

  const vscodeData = await loadVSCodeData(cfg, pathFlag);
  if (vscodeData?.attributes) {
    if (caf) {
      caf.attributes.push(...vscodeData.attributes.attributes);
    } else {
      caf = vscodeData.attributes;
    }
  }

  if (!caf) return undefined;
  return new CustomAttributeStore(caf);
}

export async function loadCustomStylesStore(cfg: Config, pathFlag?: string): Promise<CustomStyleStore | undefined> {
  let csf;

  let path = cfg.global.stylesPath ?? '';
  if (!path) {
    path = await discoverOptionalFile(cfg, resolveStyles, pathFlag);
  }
  if (path) {
    csf = await parseCustomStyles(path);
  }

  const vscodeData = await loadVSCodeData(cfg, pathFlag);
  if (vscodeData?.styles) {
    if (csf) {
      csf.cssCustomProperties.push(...vscodeData.styles.cssCustomProperties);
    } else {
      csf = vscodeData.styles;
    }
  }

  if (!csf) return undefined;
  return new CustomStyleStore(csf);
}

async function loadVSCodeData(cfg: Config, pathFlag?: string): Promise<VSCodeResult | undefined> {
  const path = resolvedPath(cfg, pathFlag);
  if (!path) return undefined;
  return loadVSCode(path);
}

export function buildValidateConfig(cfg: Config): ValidateConfig | undefined {
  const rules = cfg['validate-html']?.rules;
  if (!rules || Object.keys(rules).length === 0) return undefined;

  const vcfg: ValidateConfig = {
    ruleSeverities: new Map(),
    ruleOptions: new Map()
  };

  for (const [ruleID, rc] of Object.entries(rules)) {
    const sev = parseSeverity(rc.severity);
    vcfg.ruleSeverities.set(ruleID, sev);

    if (rc.options.tags?.length || rc.options.events?.length) {
      vcfg.ruleOptions.set(ruleID, {
        tags: rc.options.tags,
        events: rc.options.events
      });
    }
  }

  return vcfg;
}
