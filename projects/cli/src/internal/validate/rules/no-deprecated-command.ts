import type { Store } from '../../elements/store.js';
import { Severity, type Rule, type LintMessage, type HTMLDocument } from '../types.js';
import { resolveCommandPairs } from './command-helper.js';

export class NoDeprecatedCommand implements Rule {
  readonly id = 'no-deprecated-command';

  readonly severity = Severity.Warning;

  check(doc: HTMLDocument, store: Store): LintMessage[] {
    const msgs: LintMessage[] = [];

    for (const pair of resolveCommandPairs(doc, store)) {
      for (const c of pair.declaration.commands ?? []) {
        if (c.name === pair.commandAttr.value && c.deprecated) {
          msgs.push({
            ruleId: this.id,
            severity: this.severity,
            message: `Command "${pair.commandAttr.value}" for <${pair.targetTag}> is deprecated. ${c.deprecated}`,
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
