import type { Store } from '../../elements/store.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { resolveCommandPairs } from './command-helper.js';

export class NoDeprecatedCommand implements Rule {
  readonly id: string;
  readonly severity: Severity;

  constructor() {
    this.id = 'no-deprecated-command';
    this.severity = Severity.Warning;
  }

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];

    for (const pair of resolveCommandPairs(doc, store)) {
      for (const cmd of pair.declaration.commands ?? []) {
        if (cmd.name === pair.commandAttr.value && cmd.deprecated) {
          msgs.push({
            ruleId: this.id,
            severity: this.severity,
            message: `Command "${pair.commandAttr.value}" for <${pair.targetTag}> is deprecated. ${cmd.deprecated}`,
            line: pair.commandAttr.line,
            column: pair.commandAttr.column
          });
          break;
        }
      }
    }

    return msgs;
  }
}
