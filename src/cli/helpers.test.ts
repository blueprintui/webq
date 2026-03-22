import { describe, test, expect, afterEach } from 'bun:test';
import { resolvedPath, buildValidateConfig, createStore, printJSON } from './helpers.js';
import type { Config } from '../internal/config/config.js';
import { Severity } from '../internal/validate/types.js';
import { join } from 'path';

const testdataPath = join(import.meta.dir, '../../testdata');

function emptyConfig(): Config {
  return {
    global: { path: [] },
    'validate-html': { rules: {} }
  };
}

describe('resolvedPath', () => {
  const originalEnv = process.env.WEBQ_PATH;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.WEBQ_PATH;
    } else {
      process.env.WEBQ_PATH = originalEnv;
    }
  });

  test('prefers pathFlag over config and env', () => {
    const cfg = emptyConfig();
    cfg.global.path = ['./from-config'];
    process.env.WEBQ_PATH = './from-env';
    expect(resolvedPath(cfg, './from-flag')).toBe('./from-flag');
  });

  test('falls back to config path', () => {
    const cfg = emptyConfig();
    cfg.global.path = ['./path-a', './path-b'];
    delete process.env.WEBQ_PATH;
    expect(resolvedPath(cfg, undefined)).toBe('./path-a,./path-b');
  });

  test('falls back to WEBQ_PATH env', () => {
    const cfg = emptyConfig();
    process.env.WEBQ_PATH = './from-env';
    expect(resolvedPath(cfg, undefined)).toBe('./from-env');
  });

  test('defaults to cwd when nothing set', () => {
    const cfg = emptyConfig();
    delete process.env.WEBQ_PATH;
    expect(resolvedPath(cfg, undefined)).toBe(process.cwd());
  });
});

describe('buildValidateConfig', () => {
  test('returns undefined for empty rules', () => {
    const cfg = emptyConfig();
    expect(buildValidateConfig(cfg)).toBeUndefined();
  });

  test('maps rule severities', () => {
    const cfg = emptyConfig();
    cfg['validate-html'].rules = {
      'no-unknown-element': { severity: 'error', options: {} },
      'no-unknown-attr': { severity: 'warn', options: {} },
      'no-deprecated-element': { severity: 'off', options: {} }
    };
    const vcfg = buildValidateConfig(cfg);
    expect(vcfg).toBeDefined();
    expect(vcfg?.ruleSeverities.get('no-unknown-element')).toBe(Severity.Error);
    expect(vcfg?.ruleSeverities.get('no-unknown-attr')).toBe(Severity.Warning);
    expect(vcfg?.ruleSeverities.get('no-deprecated-element')).toBe(Severity.Off);
  });

  test('maps rule options with tags', () => {
    const cfg = emptyConfig();
    cfg['validate-html'].rules = {
      'no-unknown-element': { severity: 'error', options: { tags: ['my-custom'] } }
    };
    const vcfg = buildValidateConfig(cfg);
    expect(vcfg?.ruleOptions.get('no-unknown-element')?.tags).toEqual(['my-custom']);
  });

  test('maps rule options with events', () => {
    const cfg = emptyConfig();
    cfg['validate-html'].rules = {
      'no-unknown-event': { severity: 'error', options: { events: ['my-event'] } }
    };
    const vcfg = buildValidateConfig(cfg);
    expect(vcfg?.ruleOptions.get('no-unknown-event')?.events).toEqual(['my-event']);
  });

  test('skips rule options when no tags or events', () => {
    const cfg = emptyConfig();
    cfg['validate-html'].rules = {
      'no-unknown-element': { severity: 'error', options: {} }
    };
    const vcfg = buildValidateConfig(cfg);
    expect(vcfg?.ruleOptions.has('no-unknown-element')).toBe(false);
  });
});

describe('createStore', () => {
  test('creates store from testdata path', async () => {
    const store = await createStore(testdataPath);
    const elements = store.listElements();
    expect(elements.length).toBeGreaterThan(0);
    expect(elements.some(e => e.tagName === 'bp-button')).toBe(true);
  });

  test('defaults to cwd when path is empty', async () => {
    const store = await createStore('');
    expect(store).toBeDefined();
  });

  test('throws for nonexistent path', async () => {
    await expect(createStore('/nonexistent/path')).rejects.toThrow();
  });
});

describe('printJSON', () => {
  test('outputs JSON to stdout', () => {
    const original = console.log;
    let output = '';
    console.log = (s: string) => {
      output = s;
    };
    try {
      printJSON({ key: 'value' });
      expect(output).toBe(JSON.stringify({ key: 'value' }, null, 2));
    } finally {
      console.log = original;
    }
  });
});
