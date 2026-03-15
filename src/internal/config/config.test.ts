import { describe, test, expect } from 'bun:test';
import { parseSeverity, parseRuleConfig, load } from './config.js';
import { join } from 'path';
import { writeFile, unlink } from 'fs/promises';

describe('Config', () => {
  test('load returns empty config when no file exists', async () => {
    const cfg = await load();
    expect(cfg.global.path).toEqual([]);
    expect(cfg['validate-html'].rules).toEqual({});
  });

  test('load throws for explicit nonexistent path', async () => {
    await expect(load('/nonexistent/webq.config.json')).rejects.toThrow('failed to read config file');
  });

  test('load parses valid config file', async () => {
    const tmpPath = join(import.meta.dir, '__test-config.json');
    await writeFile(
      tmpPath,
      JSON.stringify({
        global: { path: ['./testdata'] },
        'validate-html': { rules: { 'no-unknown-element': 'error' } }
      })
    );
    try {
      const cfg = await load(tmpPath);
      expect(cfg.global.path).toEqual(['./testdata']);
      expect(cfg['validate-html'].rules['no-unknown-element'].severity).toBe('error');
    } finally {
      await unlink(tmpPath);
    }
  });

  test('parseSeverity converts error', () => {
    expect(parseSeverity('error')).toBe(2);
  });

  test('parseSeverity converts warn', () => {
    expect(parseSeverity('warn')).toBe(1);
  });

  test('parseSeverity converts off', () => {
    expect(parseSeverity('off')).toBe(0);
  });

  test('parseSeverity throws for invalid', () => {
    expect(() => parseSeverity('invalid')).toThrow();
  });

  test('parseRuleConfig handles string', () => {
    const rc = parseRuleConfig('error');
    expect(rc.severity).toBe('error');
    expect(rc.options).toEqual({});
  });

  test('parseRuleConfig handles tuple', () => {
    const rc = parseRuleConfig(['error', { tags: ['my-element'] }]);
    expect(rc.severity).toBe('error');
    expect(rc.options.tags).toEqual(['my-element']);
  });

  test('parseRuleConfig throws for invalid', () => {
    expect(() => parseRuleConfig(42)).toThrow();
  });
});
