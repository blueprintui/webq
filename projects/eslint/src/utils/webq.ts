import { execFileSync } from 'node:child_process';

export interface WebqMessage {
  ruleId: string;
  severity: number;
  message: string;
  line: number;
  column: number;
}

interface WebqResult {
  messages: WebqMessage[];
  errorCount: number;
  warningCount: number;
}

const cache = new Map<string, WebqMessage[]>();
let webqMissingWarned = false;

export function runWebqValidation(html: string, path: string): WebqMessage[] {
  const key = `${path}\0${html}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const stdout = execFileSync('webq', ['validate-html', html, '--path', path, '--json'], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const result: WebqResult = JSON.parse(stdout);
    cache.set(key, result.messages);
    return result.messages;
  } catch (e: any) {
    if (e.stdout) {
      try {
        const result: WebqResult = JSON.parse(e.stdout);
        cache.set(key, result.messages);
        return result.messages;
      } catch {
        /* fall through */
      }
    }

    if (e.code === 'ENOENT' && !webqMissingWarned) {
      webqMissingWarned = true;
      console.error(
        '[@webq/eslint] The "webq" CLI tool is not installed or not on PATH.\n' +
          'Install it with: go install github.com/blueprintui/webq@latest\n' +
          'Or download from: https://github.com/blueprintui/webq/releases'
      );
    }

    cache.set(key, []);
    return [];
  }
}
