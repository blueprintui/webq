import type { Store } from '../../elements/store.js';
import type { Command } from '../../elements/types.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { resolveCommandPairs } from './command-helper.js';
import { formatSuggestion } from './suggestion.js';

export class NoUnknownCommand implements Rule {
  readonly id: string;
  readonly severity: Severity;

  constructor() {
    this.id = 'no-unknown-command';
    this.severity = Severity.Error;
  }

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];

    for (const pair of resolveCommandPairs(doc, store)) {
      const cmdSet = new Set((pair.declaration.commands ?? []).map(cmd => cmd.name));

      if (!cmdSet.has(pair.commandAttr.value)) {
        const suggestion = formatCommandNames(pair.declaration.commands ?? []);
        msgs.push({
          ruleId: this.id,
          severity: this.severity,
          message: `Unknown command "${pair.commandAttr.value}" for <${pair.targetTag}>. ${suggestion}`,
          line: pair.commandAttr.line,
          column: pair.commandAttr.column
        });
      }
    }

    return msgs;
  }
}

function formatCommandNames(commands: Command[]): string {
  return formatSuggestion(
    commands.map(cmd => cmd.name),
    'commands',
    'Valid commands'
  );
}
