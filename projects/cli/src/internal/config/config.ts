import { readFile } from 'fs/promises';
import { join } from 'path';
import { Severity } from '../validate/types.js';

const defaultConfigFile = 'webq.config.json';

export interface Config {
  global: GlobalConfig;
  'validate-html': ValidateHTMLConfig;
}

export interface GlobalConfig {
  path: string[];
  patternsPath?: string;
  attributesPath?: string;
  stylesPath?: string;
  tokensPath?: string;
}

export interface ValidateHTMLConfig {
  rules: Record<string, RuleConfig>;
}

export interface RuleConfig {
  severity: string;
  options: RuleOptions;
}

export interface RuleOptions {
  tags?: string[];
  events?: string[];
}

export function parseRuleConfig(raw: unknown): RuleConfig {
  if (typeof raw === 'string') {
    return { severity: raw, options: {} };
  }
  if (Array.isArray(raw) && raw.length === 2) {
    return {
      severity: raw[0] as string,
      options: (raw[1] as RuleOptions) || {}
    };
  }
  throw new Error(`rule config must be a string or [string, object], got: ${JSON.stringify(raw)}`);
}

export async function load(path?: string): Promise<Config> {
  const explicit = Boolean(path);
  let resolvedPath = path;
  if (!resolvedPath) {
    resolvedPath = join(process.cwd(), defaultConfigFile);
  }

  let data: string;
  try {
    data = await readFile(resolvedPath, 'utf-8');
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT' && !explicit) {
      return emptyConfig();
    }
    throw new Error(`failed to read config file: ${(err as Error).message}`, { cause: err });
  }

  const raw = JSON.parse(data);
  return normalizeConfig(raw);
}

function emptyConfig(): Config {
  return {
    global: { path: [] },
    'validate-html': { rules: {} }
  };
}

function normalizeConfig(raw: unknown): Config {
  const obj = raw as Record<string, unknown>;
  const cfg = emptyConfig();

  const global = obj.global as Record<string, unknown> | undefined;
  if (global) {
    cfg.global.path = (global.path as string[]) || [];
    cfg.global.patternsPath = global.patternsPath as string | undefined;
    cfg.global.attributesPath = global.attributesPath as string | undefined;
    cfg.global.stylesPath = global.stylesPath as string | undefined;
    cfg.global.tokensPath = global.tokensPath as string | undefined;
  }

  const validateHTML = obj['validate-html'] as Record<string, unknown> | undefined;
  if (validateHTML?.rules) {
    for (const [ruleID, rc] of Object.entries(validateHTML.rules as Record<string, unknown>)) {
      cfg['validate-html'].rules[ruleID] = parseRuleConfig(rc);
    }
  }

  return cfg;
}

export function parseSeverity(severity: string): Severity {
  switch (severity) {
    case 'error':
      return Severity.Error;
    case 'warn':
      return Severity.Warning;
    case 'off':
      return Severity.Off;
    default:
      throw new Error(`invalid severity "${severity}": must be "error", "warn", or "off"`);
  }
}
