#!/usr/bin/env bun
import yargs, { type Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  createStore,
  createStoreFromConfig,
  loadConfig,
  resolvedPath,
  printJSON,
  loadPatternsStore,
  loadCustomAttributesStore,
  loadCustomStylesStore,
  buildValidateConfig
} from './cli/helpers.js';
import type { ToolContext, ToolModule } from './internal/tools.js';
import { Severity } from './internal/validate/types.js';
import type { LintResult } from './internal/validate/types.js';
import { resolvePaths } from './internal/elements/resolver.js';
import { parseManifest, validate as validateManifest } from './internal/elements/parser.js';
import { Server } from './internal/mcp/server.js';
import { readFile, writeFile, mkdir, stat } from 'fs/promises';
import { join } from 'path';

import * as elementList from './internal/elements/tools/list.js';
import * as elementGet from './internal/elements/tools/get.js';
import * as elementAttributes from './internal/elements/tools/attributes.js';
import * as elementProperties from './internal/elements/tools/properties.js';
import * as elementMethods from './internal/elements/tools/methods.js';
import * as elementEvents from './internal/elements/tools/events.js';
import * as elementSlots from './internal/elements/tools/slots.js';
import * as elementCommands from './internal/elements/tools/commands.js';
import * as elementCSSProperties from './internal/elements/tools/css-properties.js';
import * as elementCSSParts from './internal/elements/tools/css-parts.js';
import * as patternList from './internal/patterns/tools/list.js';
import * as patternGet from './internal/patterns/tools/get.js';
import * as attributeList from './internal/attributes/tools/list.js';
import * as attributeGet from './internal/attributes/tools/get.js';
import * as stylePropertyList from './internal/styles/tools/list.js';
import * as stylePropertyGet from './internal/styles/tools/get.js';
import * as validateHTML from './internal/validate/tools/validate-html.js';
import { colorize, printMarkdown, wrapText } from './cli/format.js';

const Version = '0.0.0';

const MAX_WIDTH = Math.min(process.stdout.columns ?? 100, 100);

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

async function buildElementContext(argv: Record<string, unknown>): Promise<ToolContext> {
  const store = await createStore(argv.path as string, argv.config as string);
  return { store };
}

async function buildFullContext(argv: Record<string, unknown>): Promise<ToolContext> {
  const cfg = await loadConfig(argv.config as string);
  const store = await createStoreFromConfig(cfg, argv.path as string);
  const validateCfg = buildValidateConfig(cfg);
  const patternStore = await loadPatternsStore(cfg, argv.path as string);
  const customAttrStore = await loadCustomAttributesStore(cfg, argv.path as string);
  const customStyleStore = await loadCustomStylesStore(cfg, argv.path as string);
  return { store, patternStore, customAttrStore, customStyleStore, validateCfg };
}

function elementHandler(tool: ToolModule, extractInput?: (argv: Record<string, unknown>) => Record<string, unknown>) {
  return async (argv: Record<string, unknown>) => {
    const ctx = await buildElementContext(argv);
    const input = extractInput?.(argv);
    if (argv.json) {
      printJSON(tool.toJSON(ctx, input));
      return;
    }
    printMarkdown(tool.toMarkdown(ctx, input));
  };
}

function optionalStoreHandler(
  tool: ToolModule,
  buildCtx: (argv: Record<string, unknown>) => Promise<ToolContext>,
  storeCheck: (ctx: ToolContext) => boolean,
  storeName: string,
  extractInput?: (argv: Record<string, unknown>) => Record<string, unknown>
) {
  return async (argv: Record<string, unknown>) => {
    const ctx = await buildCtx(argv);
    if (!storeCheck(ctx)) {
      process.stderr.write(`No ${storeName} found\n`);
      return;
    }
    const input = extractInput?.(argv);
    if (argv.json) {
      printJSON(tool.toJSON(ctx, input));
      return;
    }
    printMarkdown(tool.toMarkdown(ctx, input));
  };
}

const tagNamePositional = (y: Argv) => y.positional('tag-name', { type: 'string', demandOption: true });
const namePositional = (y: Argv) => y.positional('name', { type: 'string', demandOption: true });
const extractTagName = (argv: Record<string, unknown>) => ({ tagName: argv['tag-name'] as string });
const extractName = (argv: Record<string, unknown>) => ({ name: argv.name as string });

async function buildPatternContext(argv: Record<string, unknown>): Promise<ToolContext> {
  const cfg = await loadConfig(argv.config as string);
  const patternStore = await loadPatternsStore(cfg, argv.path as string);
  const store = await createStoreFromConfig(cfg, argv.path as string);
  return { store, patternStore };
}

async function buildAttrContext(argv: Record<string, unknown>): Promise<ToolContext> {
  const cfg = await loadConfig(argv.config as string);
  const customAttrStore = await loadCustomAttributesStore(cfg, argv.path as string);
  const store = await createStoreFromConfig(cfg, argv.path as string);
  return { store, customAttrStore };
}

async function buildStyleContext(argv: Record<string, unknown>): Promise<ToolContext> {
  const cfg = await loadConfig(argv.config as string);
  const customStyleStore = await loadCustomStylesStore(cfg, argv.path as string);
  const store = await createStoreFromConfig(cfg, argv.path as string);
  return { store, customStyleStore };
}

const hasPatterns = (ctx: ToolContext) => !!ctx.patternStore;
const hasAttrs = (ctx: ToolContext) => !!ctx.customAttrStore;
const hasStyles = (ctx: ToolContext) => !!ctx.customStyleStore;

const cli = yargs(hideBin(process.argv))
  .scriptName('webq')
  .version(Version)
  .usage('$0 <cmd> [args]')
  .recommendCommands()
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
  .command('$0', 'About WebQ', {}, async () => {
    process.stderr.write(
      colorize.blue(`__        __   _      ___
\\ \\      / /__| |__  / _ \\
 \\ \\ /\\ / / _ \\ '_ \\| | | |
  \\ V  V /  __/ |_) | |_| |
   \\_/\\_/ \\___|_.__/ \\__\\_\\`)
    );

    process.stderr.write(
      `\n\n${wrapText(
        "WebQ is a CLI tool for querying Custom Elements Manifest (CEM) files and other Web UI schema files. Use 'mcp' to start the MCP (Model Context Protocol) server for AI assistants.",
        MAX_WIDTH
      )}\nhttps://github.com/blueprintui/webq\n\n`
    );
    process.stderr.write(await cli.getHelp());
  })
  // MCP server
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
  // Setup commands
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
        process.stderr.write(`warning: skill template not found at ${templatePath}, using default\n`);
        template = '# WebQ Skill\n';
      }
      await writeFile(skillFile, template);
      process.stderr.write(`Created skill file at ${skillFile}\n`);
    }
  )
  // Element commands
  .command(elementList.metadata.command, elementList.metadata.summary, {}, elementHandler(elementList))
  .command(
    elementGet.metadata.command,
    elementGet.metadata.summary,
    tagNamePositional,
    elementHandler(elementGet, extractTagName)
  )
  .command(
    elementAttributes.metadata.command,
    elementAttributes.metadata.summary,
    tagNamePositional,
    elementHandler(elementAttributes, extractTagName)
  )
  .command(
    elementProperties.metadata.command,
    elementProperties.metadata.summary,
    tagNamePositional,
    elementHandler(elementProperties, extractTagName)
  )
  .command(
    elementMethods.metadata.command,
    elementMethods.metadata.summary,
    tagNamePositional,
    elementHandler(elementMethods, extractTagName)
  )
  .command(
    elementEvents.metadata.command,
    elementEvents.metadata.summary,
    tagNamePositional,
    elementHandler(elementEvents, extractTagName)
  )
  .command(
    elementSlots.metadata.command,
    elementSlots.metadata.summary,
    tagNamePositional,
    elementHandler(elementSlots, extractTagName)
  )
  .command(
    elementCommands.metadata.command,
    elementCommands.metadata.summary,
    tagNamePositional,
    elementHandler(elementCommands, extractTagName)
  )
  .command(
    elementCSSProperties.metadata.command,
    elementCSSProperties.metadata.summary,
    tagNamePositional,
    elementHandler(elementCSSProperties, extractTagName)
  )
  .command(
    elementCSSParts.metadata.command,
    elementCSSParts.metadata.summary,
    tagNamePositional,
    elementHandler(elementCSSParts, extractTagName)
  )
  // Attribute commands
  .command(
    attributeList.metadata.command,
    attributeList.metadata.summary,
    {},
    optionalStoreHandler(attributeList, buildAttrContext, hasAttrs, 'custom-attributes.json')
  )
  .command(
    attributeGet.metadata.command,
    attributeGet.metadata.summary,
    namePositional,
    optionalStoreHandler(attributeGet, buildAttrContext, hasAttrs, 'custom-attributes.json', extractName)
  )
  // Style commands
  .command(
    stylePropertyList.metadata.command,
    stylePropertyList.metadata.summary,
    {},
    optionalStoreHandler(stylePropertyList, buildStyleContext, hasStyles, 'custom-styles.json')
  )
  .command(
    stylePropertyGet.metadata.command,
    stylePropertyGet.metadata.summary,
    namePositional,
    optionalStoreHandler(stylePropertyGet, buildStyleContext, hasStyles, 'custom-styles.json', argv => {
      let name = argv.name as string;
      if (!name.startsWith('--')) name = '--' + name;
      return { name };
    })
  )
  // Pattern commands
  .command(
    patternList.metadata.command,
    patternList.metadata.summary,
    {},
    optionalStoreHandler(patternList, buildPatternContext, hasPatterns, 'custom-patterns.json')
  )
  .command(
    patternGet.metadata.command,
    patternGet.metadata.summary,
    namePositional,
    optionalStoreHandler(patternGet, buildPatternContext, hasPatterns, 'custom-patterns.json', extractName)
  )
  // Validate HTML
  .command(
    validateHTML.metadata.command,
    validateHTML.metadata.summary,
    y =>
      y
        .positional('html', { type: 'string', demandOption: true })
        .option('rule', { type: 'string', description: 'Run a specific rule' }),
    async argv => {
      const ctx = await buildFullContext(argv);
      const input = { html: argv.html as string, rule: argv.rule as string | undefined };
      const result = validateHTML.toJSON(ctx, input) as LintResult;
      if (argv.json) {
        printJSON(result);
        if (result.errorCount > 0) process.exit(1);
        return;
      }
      if (printLintResult(result)) process.exit(1);
    }
  )
  // Validate manifest
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
  .strict()
  .fail(false)
  .help();

cli.wrap(MAX_WIDTH);

cli.parseAsync().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`${colorize.error('error:')} ${message}\n`);
  process.exit(1);
});
