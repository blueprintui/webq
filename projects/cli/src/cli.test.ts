import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const CLI_ENTRY = join(import.meta.dir, 'cli.ts');
const TESTDATA = join(import.meta.dir, '../testdata');

interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

async function runCli(args: string[], cwd?: string): Promise<RunResult> {
  const proc = Bun.spawn(['bun', CLI_ENTRY, ...args], {
    cwd: cwd ?? process.cwd(),
    stdout: 'pipe',
    stderr: 'pipe',
    env: { ...process.env, NO_COLOR: '1' }
  });
  const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
  const exitCode = await proc.exited;
  return { stdout, stderr, exitCode };
}

describe('CLI entrypoint', () => {
  describe('validate-manifest', () => {
    test('succeeds on valid testdata manifest', async () => {
      const { stderr, exitCode } = await runCli(['validate-manifest', '--path', TESTDATA]);
      expect(exitCode).toBe(0);
      expect(stderr).toContain('Manifest is valid');
      expect(stderr).toContain('custom-elements.json');
    });

    test('exits 1 when no path configured', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'webq-cli-'));
      try {
        // Run inside a directory with no config and no WEBQ_PATH
        const proc = Bun.spawn(['bun', CLI_ENTRY, 'validate-manifest'], {
          cwd: tmp,
          stdout: 'pipe',
          stderr: 'pipe',
          env: { ...process.env, WEBQ_PATH: '', NO_COLOR: '1' }
        });
        const stderr = await new Response(proc.stderr).text();
        const exitCode = await proc.exited;
        expect(exitCode).toBe(1);
        expect(stderr).toMatch(/no custom-elements\.json files found|--path flag/);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    test('exits 1 when path has no manifests', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'webq-cli-'));
      try {
        const { stderr, exitCode } = await runCli(['validate-manifest', '--path', tmp]);
        expect(exitCode).toBe(1);
        expect(stderr).toContain('no custom-elements.json files found');
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    test('reports schema errors and exits 1', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'webq-cli-'));
      try {
        writeFileSync(join(tmp, 'custom-elements.json'), JSON.stringify({ modules: [{}] }));
        const { stderr, exitCode } = await runCli(['validate-manifest', '--path', tmp]);
        expect(exitCode).toBe(1);
        expect(stderr).toContain('Validation errors');
        expect(stderr).toContain('missing schemaVersion');
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });
  });

  describe('setup-mcp', () => {
    let tmp: string;
    beforeEach(() => {
      tmp = mkdtempSync(join(tmpdir(), 'webq-cli-setup-'));
    });
    afterEach(() => {
      rmSync(tmp, { recursive: true, force: true });
    });

    test('creates .mcp.json when none exists', async () => {
      const { exitCode, stderr } = await runCli(['setup-mcp'], tmp);
      expect(exitCode).toBe(0);
      expect(stderr).toContain('Created');
      const mcpPath = join(tmp, '.mcp.json');
      expect(existsSync(mcpPath)).toBe(true);
      const parsed = JSON.parse(readFileSync(mcpPath, 'utf-8'));
      expect(parsed.mcpServers.webq.command).toBe('webq');
      expect(parsed.mcpServers.webq.args).toContain('mcp');
    });

    test('second run without --force exits 1', async () => {
      await runCli(['setup-mcp'], tmp);
      const { exitCode, stderr } = await runCli(['setup-mcp'], tmp);
      expect(exitCode).toBe(1);
      expect(stderr).toMatch(/already exists.*--force/s);
    });

    test('--force overwrites existing entry', async () => {
      await runCli(['setup-mcp'], tmp);
      const { exitCode } = await runCli(['setup-mcp', '--force'], tmp);
      expect(exitCode).toBe(0);
    });

    test('preserves existing mcpServers entries from other tools', async () => {
      const mcpPath = join(tmp, '.mcp.json');
      writeFileSync(mcpPath, JSON.stringify({ mcpServers: { other: { command: 'other-cli' } } }));
      const { exitCode } = await runCli(['setup-mcp'], tmp);
      expect(exitCode).toBe(0);
      const parsed = JSON.parse(readFileSync(mcpPath, 'utf-8'));
      expect(parsed.mcpServers.other.command).toBe('other-cli');
      expect(parsed.mcpServers.webq).toBeDefined();
    });
  });

  describe('element command', () => {
    test('--json prints JSON for known element', async () => {
      const { stdout, exitCode } = await runCli(['element', 'bp-button', '--json', '--path', TESTDATA]);
      expect(exitCode).toBe(0);
      const parsed = JSON.parse(stdout);
      expect(parsed.tagName).toBe('bp-button');
    });

    test('exits non-zero for unknown element', async () => {
      const { exitCode, stderr } = await runCli(['element', 'does-not-exist', '--json', '--path', TESTDATA]);
      expect(exitCode).toBe(1);
      expect(stderr).toContain('does-not-exist');
    });
  });

  describe('validate-html command', () => {
    test('rejects unknown rule name', async () => {
      const { exitCode, stderr } = await runCli([
        'validate-html',
        '<bp-button></bp-button>',
        '--rule',
        'nonexistent-rule',
        '--path',
        TESTDATA
      ]);
      expect(exitCode).toBe(1);
      expect(stderr).toContain('nonexistent-rule');
    });

    test('exits 1 when errors are reported', async () => {
      const { exitCode, stderr } = await runCli([
        'validate-html',
        '<bp-button unknown-attr="x"></bp-button>',
        '--path',
        TESTDATA
      ]);
      expect(exitCode).toBe(1);
      expect(stderr).toMatch(/unknown-attr/);
    });

    test('exits 0 for clean HTML', async () => {
      const { exitCode } = await runCli(['validate-html', '<bp-button></bp-button>', '--path', TESTDATA]);
      expect(exitCode).toBe(0);
    });
  });

  describe('global behavior', () => {
    test('--help exits 0', async () => {
      const { stdout, exitCode } = await runCli(['--help']);
      expect(exitCode).toBe(0);
      expect(stdout).toContain('webq');
    });

    test('unknown command is rejected', async () => {
      const { exitCode, stderr } = await runCli(['definitely-not-a-command']);
      expect(exitCode).toBe(1);
      expect(stderr).toMatch(/error:/);
    });
  });
});
