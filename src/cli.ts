#!/usr/bin/env bun
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  createStore,
  createStoreFromConfig,
  loadConfig,
  resolvedPath,
  getElementOrError,
  printJSON,
  loadPatternsStore,
  loadCustomAttributesStore,
  loadCustomStylesStore,
  buildValidateConfig
} from './cli/helpers.js';
import {
  formatElementSummaries,
  formatElement,
  formatAttributesValue,
  formatMembersValue,
  formatMethodsValue,
  formatEventsValue,
  formatSlotsValue,
  formatCSSPropertiesValue,
  formatCommandsValue,
  formatCSSPartsValue,
  formatPatternSummaries,
  formatPattern,
  formatCustomAttributeSummaries,
  formatCustomAttribute,
  formatCSSCustomPropertySummaries,
  formatCSSCustomPropertyDetail
} from './cli/format.js';
import { verify, allRules, getRule } from './internal/validate/validate.js';
import { Severity } from './internal/validate/types.js';
import type { LintResult } from './internal/validate/types.js';
import { resolvePaths } from './internal/elements/resolver.js';
import { parseManifest, validate as validateManifest } from './internal/elements/parser.js';
import { Server } from './internal/mcp/server.js';
import { readFile, writeFile, mkdir, stat } from 'fs/promises';
import { join } from 'path';
import './internal/validate/rules/index.js';

const Version = '0.0.0';

function printMarkdown(md: string): void {
  process.stderr.write(md);
}

function printLintResult(result: LintResult): boolean {
  for (const msg of result.messages) {
    const severity = msg.severity === Severity.Error ? 'error' : 'warning';
    process.stderr.write(`  ${msg.line}:${msg.column}  ${severity}  ${msg.message}  ${msg.ruleId}\n`);
  }

  if (result.errorCount > 0 || result.warningCount > 0) {
    process.stderr.write(`\n  ${result.errorCount} error(s), ${result.warningCount} warning(s)\n`);
  }

  return result.errorCount > 0;
}

const cli = yargs(hideBin(process.argv))
  .scriptName('webq')
  .version(Version)
  .option('path', {
    type: 'string',
    description: 'Directory path(s) to search recursively for schema files, comma-separated'
  })
  .option('json', {
    type: 'boolean',
    default: false,
    description: 'Output raw JSON instead of formatted markdown'
  })
  .option('config', { type: 'string', description: 'Path to webq.config.json' })
  .command('element.list', 'List all custom elements', {}, async argv => {
    const store = await createStore(argv.path as string, argv.config as string);
    const summaries = store.getElementSummaries();
    if (argv.json) {
      printJSON(summaries);
      return;
    }
    printMarkdown(formatElementSummaries(summaries));
  })
  .command(
    'element <tag-name>',
    'Get full details for a custom element',
    y => y.positional('tag-name', { type: 'string', demandOption: true }),
    async argv => {
      const store = await createStore(argv.path as string, argv.config as string);
      const element = getElementOrError(store, argv['tag-name'] as string);
      if (argv.json) {
        printJSON(element);
        return;
      }
      printMarkdown(formatElement(element));
    }
  )
  .command(
    'element.attributes <tag-name>',
    'Get HTML attributes for a custom element',
    y => y.positional('tag-name', { type: 'string', demandOption: true }),
    async argv => {
      const store = await createStore(argv.path as string, argv.config as string);
      const tagName = argv['tag-name'] as string;
      getElementOrError(store, tagName);
      if (argv.json) {
        printJSON(store.getAttributes(tagName));
        return;
      }
      printMarkdown(formatAttributesValue(store.getAttributes(tagName), tagName));
    }
  )
  .command(
    'element.properties <tag-name>',
    'Get JavaScript properties for a custom element',
    y => y.positional('tag-name', { type: 'string', demandOption: true }),
    async argv => {
      const store = await createStore(argv.path as string, argv.config as string);
      const tagName = argv['tag-name'] as string;
      getElementOrError(store, tagName);
      if (argv.json) {
        printJSON(store.getProperties(tagName));
        return;
      }
      printMarkdown(formatMembersValue(store.getProperties(tagName), tagName, 'Properties'));
    }
  )
  .command(
    'element.methods <tag-name>',
    'Get methods for a custom element',
    y => y.positional('tag-name', { type: 'string', demandOption: true }),
    async argv => {
      const store = await createStore(argv.path as string, argv.config as string);
      const tagName = argv['tag-name'] as string;
      getElementOrError(store, tagName);
      if (argv.json) {
        printJSON(store.getMethods(tagName));
        return;
      }
      printMarkdown(formatMethodsValue(store.getMethods(tagName), tagName));
    }
  )
  .command(
    'element.events <tag-name>',
    'Get events for a custom element',
    y => y.positional('tag-name', { type: 'string', demandOption: true }),
    async argv => {
      const store = await createStore(argv.path as string, argv.config as string);
      const tagName = argv['tag-name'] as string;
      getElementOrError(store, tagName);
      if (argv.json) {
        printJSON(store.getEvents(tagName));
        return;
      }
      printMarkdown(formatEventsValue(store.getEvents(tagName), tagName));
    }
  )
  .command(
    'element.slots <tag-name>',
    'Get slots for a custom element',
    y => y.positional('tag-name', { type: 'string', demandOption: true }),
    async argv => {
      const store = await createStore(argv.path as string, argv.config as string);
      const tagName = argv['tag-name'] as string;
      getElementOrError(store, tagName);
      if (argv.json) {
        printJSON(store.getSlots(tagName));
        return;
      }
      printMarkdown(formatSlotsValue(store.getSlots(tagName), tagName));
    }
  )
  .command(
    'element.commands <tag-name>',
    'Get invoker commands for a custom element',
    y => y.positional('tag-name', { type: 'string', demandOption: true }),
    async argv => {
      const store = await createStore(argv.path as string, argv.config as string);
      const tagName = argv['tag-name'] as string;
      getElementOrError(store, tagName);
      if (argv.json) {
        printJSON(store.getCommands(tagName));
        return;
      }
      printMarkdown(formatCommandsValue(store.getCommands(tagName), tagName));
    }
  )
  .command(
    'element.css-properties <tag-name>',
    'Get CSS custom properties for a custom element',
    y => y.positional('tag-name', { type: 'string', demandOption: true }),
    async argv => {
      const store = await createStore(argv.path as string, argv.config as string);
      const tagName = argv['tag-name'] as string;
      getElementOrError(store, tagName);
      if (argv.json) {
        printJSON(store.getCSSProperties(tagName));
        return;
      }
      printMarkdown(formatCSSPropertiesValue(store.getCSSProperties(tagName), tagName));
    }
  )
  .command(
    'element.css-parts <tag-name>',
    'Get CSS parts for a custom element',
    y => y.positional('tag-name', { type: 'string', demandOption: true }),
    async argv => {
      const store = await createStore(argv.path as string, argv.config as string);
      const tagName = argv['tag-name'] as string;
      getElementOrError(store, tagName);
      if (argv.json) {
        printJSON(store.getCSSParts(tagName));
        return;
      }
      printMarkdown(formatCSSPartsValue(store.getCSSParts(tagName), tagName));
    }
  )
  .command(
    'validate-html <html>',
    'Validate HTML against custom elements manifest',
    y =>
      y
        .positional('html', { type: 'string', demandOption: true })
        .option('rule', { type: 'string', description: 'Run a specific rule' }),
    async argv => {
      const cfg = await loadConfig(argv.config as string);
      const store = await createStoreFromConfig(cfg, argv.path as string);
      let rules = allRules();
      if (argv.rule) {
        const r = getRule(argv.rule);
        if (!r) {
          process.stderr.write(`unknown rule "${argv.rule}"\n`);
          process.exit(1);
        }
        rules = [r];
      }
      const vcfg = buildValidateConfig(cfg);
      const ps = await loadPatternsStore(cfg, argv.path as string);
      const css = await loadCustomStylesStore(cfg, argv.path as string);
      const cas = await loadCustomAttributesStore(cfg, argv.path as string);
      const result = verify(argv.html as string, store, rules, vcfg, {
        patternStore: ps,
        customStyleStore: css,
        customAttributeStore: cas
      });
      if (argv.json) {
        printJSON(result);
        if (result.errorCount > 0) process.exit(1);
        return;
      }
      if (printLintResult(result)) process.exit(1);
    }
  )
  .command('validate-manifest', 'Validate a Custom Elements Manifest file', {}, async argv => {
    const cfg = await loadConfig(argv.config as string);
    const path = resolvedPath(cfg, argv.path as string);
    if (!path) {
      process.stderr.write('--path flag, webq.config.json, or WEBQ_PATH environment variable is required\n');
      process.exit(1);
    }
    const manifestPaths = await resolvePaths(path);
    if (!manifestPaths.length) {
      process.stderr.write('no custom-elements.json files found in provided paths\n');
      process.exit(1);
    }
    let hasErrors = false;
    for (const p of manifestPaths) {
      const manifest = await parseManifest(p);
      const validationErrors = validateManifest(manifest);
      process.stderr.write(
        `Manifest: ${p}\nSchema Version: ${manifest.schemaVersion}\nModules: ${manifest.modules.length}\n`
      );
      let elementCount = 0;
      for (const module of manifest.modules) {
        for (const decl of module.declarations ?? []) {
          if (decl.tagName) elementCount++;
        }
      }
      process.stderr.write(`Custom Elements: ${elementCount}\n`);
      if (validationErrors.length > 0) {
        hasErrors = true;
        process.stderr.write('Validation errors:\n');
        for (const e of validationErrors) process.stderr.write(`  ✗ ${e.message}\n`);
      } else {
        process.stderr.write('✓ Manifest is valid\n');
      }
      process.stderr.write('\n');
    }
    if (hasErrors) process.exit(1);
  })
  .command('pattern.list', 'List all compositional patterns', {}, async argv => {
    const cfg = await loadConfig(argv.config as string);
    const store = await loadPatternsStore(cfg, argv.path as string);
    if (!store) {
      process.stderr.write('No custom-patterns.json found\n');
      return;
    }
    const summaries = store.getPatterns();
    if (argv.json) {
      printJSON(summaries);
      return;
    }
    printMarkdown(formatPatternSummaries(summaries));
  })
  .command(
    'pattern <name>',
    'Get full details for a specific pattern',
    y => y.positional('name', { type: 'string', demandOption: true }),
    async argv => {
      const cfg = await loadConfig(argv.config as string);
      const store = await loadPatternsStore(cfg, argv.path as string);
      if (!store) {
        process.stderr.write('No custom-patterns.json found\n');
        return;
      }
      const pattern = store.getPattern(argv.name as string);
      if (!pattern) {
        process.stderr.write(`pattern "${argv.name}" not found\n`);
        process.exit(1);
      }
      if (argv.json) {
        printJSON(pattern);
        return;
      }
      printMarkdown(formatPattern(pattern));
    }
  )
  .command('attribute.list', 'List all custom attributes', {}, async argv => {
    const cfg = await loadConfig(argv.config as string);
    const store = await loadCustomAttributesStore(cfg, argv.path as string);
    if (!store) {
      process.stderr.write('No custom-attributes.json found\n');
      return;
    }
    const summaries = store.getCustomAttributes();
    if (argv.json) {
      printJSON(summaries);
      return;
    }
    printMarkdown(formatCustomAttributeSummaries(summaries));
  })
  .command(
    'attribute <name>',
    'Get full details for a specific custom attribute',
    y => y.positional('name', { type: 'string', demandOption: true }),
    async argv => {
      const cfg = await loadConfig(argv.config as string);
      const store = await loadCustomAttributesStore(cfg, argv.path as string);
      if (!store) {
        process.stderr.write('No custom-attributes.json found\n');
        return;
      }
      const attr = store.getCustomAttribute(argv.name as string);
      if (!attr) {
        process.stderr.write(`custom attribute "${argv.name}" not found\n`);
        process.exit(1);
      }
      if (argv.json) {
        printJSON(attr);
        return;
      }
      printMarkdown(formatCustomAttribute(attr));
    }
  )
  .command('style.property.list', 'List all global CSS Custom Properties', {}, async argv => {
    const cfg = await loadConfig(argv.config as string);
    const store = await loadCustomStylesStore(cfg, argv.path as string);
    if (!store) {
      process.stderr.write('No custom-styles.json found\n');
      return;
    }
    const summaries = store.getCSSCustomProperties();
    if (argv.json) {
      printJSON(summaries);
      return;
    }
    printMarkdown(formatCSSCustomPropertySummaries(summaries));
  })
  .command(
    'style.property <name>',
    'Get global CSS custom property',
    y => y.positional('name', { type: 'string', demandOption: true }),
    async argv => {
      const cfg = await loadConfig(argv.config as string);
      const store = await loadCustomStylesStore(cfg, argv.path as string);
      if (!store) {
        process.stderr.write('No custom-styles.json found\n');
        return;
      }
      let name = argv.name as string;
      if (!name.startsWith('--')) name = '--' + name;
      const prop = store.getCSSCustomProperty(name);
      if (!prop) {
        process.stderr.write(`CSS custom property "${name}" not found\n`);
        process.exit(1);
      }
      if (argv.json) {
        printJSON(prop);
        return;
      }
      printMarkdown(formatCSSCustomPropertyDetail(prop));
    }
  )
  .command('mcp', 'Start the MCP server on STDIO transport', {}, async argv => {
    const cfg = await loadConfig(argv.config as string);
    const store = await createStoreFromConfig(cfg, argv.path as string);
    const vcfg = buildValidateConfig(cfg);
    const ps = await loadPatternsStore(cfg, argv.path as string);
    const cas = await loadCustomAttributesStore(cfg, argv.path as string);
    const css = await loadCustomStylesStore(cfg, argv.path as string);
    const server = new Server({
      store,
      version: Version,
      validateCfg: vcfg,
      patternStore: ps,
      customAttrStore: cas,
      customStyleStore: css
    });
    await server.serve();
  })
  .command(
    'setup-mcp',
    'Configure the webq MCP server in .mcp.json',
    y => y.option('force', { type: 'boolean', default: false }),
    async argv => {
      const mcpFile = '.mcp.json';
      const entry = {
        command: 'webq',
        description: 'Search and query for Web Components APIs via Custom Elements Manifest',
        args: ['mcp', '--path', './node_modules']
      };
      let config: Record<string, unknown> = {};
      try {
        const data = await readFile(mcpFile, 'utf-8');
        config = JSON.parse(data);
      } catch {
        /* file doesn't exist yet, ok */
      }
      const servers = (config.mcpServers ?? {}) as Record<string, unknown>;
      if (servers.webq && !argv.force) {
        process.stderr.write(`webq entry already exists in ${mcpFile}\nUse --force to overwrite\n`);
        process.exit(1);
      }
      servers.webq = entry;
      config.mcpServers = servers;
      await writeFile(mcpFile, JSON.stringify(config, null, 2) + '\n');
      process.stderr.write(
        Object.keys(config).length > 1 ? `Added webq entry to ${mcpFile}\n` : `Created ${mcpFile}\n`
      );
    }
  )
  .command(
    'setup-skill',
    'Create a Claude Code skill for the webq CLI',
    y => y.option('force', { type: 'boolean', default: false }),
    async argv => {
      const skillDir = join('.claude', 'skills', 'webq');
      const skillFile = join(skillDir, 'SKILL.md');
      try {
        await stat(skillFile);
        if (!argv.force) {
          process.stderr.write(`skill file already exists at ${skillFile}\nUse --force to overwrite\n`);
          process.exit(1);
        }
      } catch {
        /* file doesn't exist yet, ok */
      }
      await mkdir(skillDir, { recursive: true });
      const templatePath = join(import.meta.dir, 'templates', 'skill-template.md');
      let template: string;
      try {
        template = await readFile(templatePath, 'utf-8');
      } catch {
        template = '# WebQ Skill\n';
      }
      await writeFile(skillFile, template);
      process.stderr.write(`Created skill file at ${skillFile}\n`);
    }
  )
  .demandCommand(1, 'You need at least one command')
  .strict()
  .help();

cli.parse();
