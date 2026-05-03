import { Store } from '../internal/elements/store.js';
import { parseManifest } from '../internal/elements/parser.js';
import { resolvePaths } from '../internal/elements/resolver.js';
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
import { load as loadDTCG } from '../internal/dtcg/load.js';
import { resolve as resolveTokens } from '../internal/dtcg/resolver.js';
import type { VSCodeResult } from '../internal/vscode/load.js';
import type { Manifest } from '../internal/elements/types.js';
import type { ValidateConfig } from '../internal/validate/types.js';

const errPathRequired = '--path flag, webq.config.json, or WEBQ_PATH environment variable is required';
const errNoManifestsFound = 'no custom-elements.json files found in provided paths';

export async function loadConfig(configFlag?: string): Promise<Config> {
  return loadConfigFile(configFlag || undefined);
}

export function resolvedPath(cfg: Config, pathFlag?: string): string {
  if (pathFlag) return pathFlag;
  if (cfg.global.path.length > 0) return cfg.global.path.join(',');
  return process.env.WEBQ_PATH ?? process.cwd();
}

async function parseManifestsFromPath(path: string): Promise<Manifest[]> {
  if (!path) throw new Error(errPathRequired);

  const manifestPaths = await resolvePaths(path);
  if (manifestPaths.length === 0) throw new Error(errNoManifestsFound);

  const manifests: Manifest[] = [];
  for (const manifestPath of manifestPaths) {
    manifests.push(await parseManifest(manifestPath));
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

export function printJSON(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

async function discoverOptionalFiles(
  cfg: Config,
  resolveFn: (path: string) => Promise<string[]>,
  pathFlag?: string
): Promise<string[]> {
  const path = resolvedPath(cfg, pathFlag);
  if (!path) return [];

  const matches: string[] = [];
  for (const pathArg of path.split(',')) {
    const trimmed = pathArg.trim();
    if (!trimmed) continue;
    matches.push(...(await resolveFn(trimmed)));
  }
  return matches;
}

async function resolvePatternsPaths(cfg: Config, pathFlag?: string): Promise<string[]> {
  const configured = cfg.global.patternsPath ?? '';
  if (configured) return [configured];
  return discoverOptionalFiles(cfg, resolvePatterns, pathFlag);
}

export async function loadPatternsStore(cfg: Config, pathFlag?: string): Promise<PatternStore | undefined> {
  const paths = await resolvePatternsPaths(cfg, pathFlag);
  if (paths.length === 0) return undefined;

  const [first, ...rest] = paths;
  const pf = await parsePatterns(first);
  for (const path of rest) {
    const extra = await parsePatterns(path);
    pf.patterns.push(...extra.patterns);
  }
  return new PatternStore(pf);
}

async function resolveAttributesPaths(cfg: Config, pathFlag?: string): Promise<string[]> {
  const configured = cfg.global.attributesPath ?? '';
  if (configured) return [configured];
  return discoverOptionalFiles(cfg, resolveAttributes, pathFlag);
}

export async function loadCustomAttributesStore(
  cfg: Config,
  pathFlag?: string
): Promise<CustomAttributeStore | undefined> {
  let caf;

  const paths = await resolveAttributesPaths(cfg, pathFlag);
  for (const path of paths) {
    const next = await parseCustomAttributes(path);
    if (caf) {
      caf.attributes.push(...next.attributes);
    } else {
      caf = next;
    }
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

async function resolveStylesPaths(cfg: Config, pathFlag?: string): Promise<string[]> {
  const configured = cfg.global.stylesPath ?? '';
  if (configured) return [configured];
  return discoverOptionalFiles(cfg, resolveStyles, pathFlag);
}

type StylesFile = Awaited<ReturnType<typeof parseCustomStyles>>;

function mergeStyles(base: StylesFile | undefined, extra: StylesFile | undefined): StylesFile | undefined {
  if (!extra) return base;
  if (!base) return extra;
  base.cssCustomProperties.push(...extra.cssCustomProperties);
  return base;
}

async function resolveTokensPaths(cfg: Config, pathFlag?: string): Promise<string[]> {
  const configured = cfg.global.tokensPath ?? '';
  if (configured) return [configured];
  return discoverOptionalFiles(cfg, resolveTokens, pathFlag);
}

async function loadDTCGTokens(tokensPath: string): Promise<StylesFile | undefined> {
  return (await loadDTCG(tokensPath)) ?? undefined;
}

export async function loadCustomStylesStore(cfg: Config, pathFlag?: string): Promise<CustomStyleStore | undefined> {
  let csf: StylesFile | undefined;

  for (const path of await resolveStylesPaths(cfg, pathFlag)) {
    csf = mergeStyles(csf, await parseCustomStyles(path));
  }

  const vscodeData = await loadVSCodeData(cfg, pathFlag);
  csf = mergeStyles(csf, vscodeData?.styles);

  for (const path of await resolveTokensPaths(cfg, pathFlag)) {
    csf = mergeStyles(csf, await loadDTCGTokens(path));
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
