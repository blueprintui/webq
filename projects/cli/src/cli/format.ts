import { marked, MarkedExtension } from 'marked';
import { markedTerminal } from 'marked-terminal';

import type {
  Attribute,
  Member,
  Event,
  Slot,
  CSSProperty,
  Command,
  CSSPart,
  Type,
  Declaration
} from '../internal/elements/types.js';
import type { ElementSummary } from '../internal/elements/store.js';
import { KindField, KindMethod } from '../internal/elements/types.js';
import type { PatternSummary } from '../internal/patterns/store.js';
import type { Pattern } from '../internal/patterns/types.js';
import type { CustomAttributeSummary } from '../internal/attributes/store.js';
import type { CustomAttribute } from '../internal/attributes/types.js';
import type { CSSCustomPropertySummary } from '../internal/styles/store.js';
import type { CSSCustomProperty } from '../internal/styles/types.js';

const ansiFallback: Record<string, string> = {
  '#e62f2f': '\x1b[31m',
  '#008fff': '\x1b[34m',
  '#1888df': '\x1b[34m',
  '#51da51': '\x1b[32m',
  '#e796e7': '\x1b[35m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

function color(value: string): string {
  if (typeof Bun !== 'undefined') return Bun.color(value, 'ansi') as string;
  return ansiFallback[value] ?? '';
}

export const colorize = {
  error: (msg: string) => `${color('#e62f2f')}${msg}\x1b[0m`,
  warning: (msg: string) => `${color('yellow')}${msg}\x1b[0m`,
  success: (msg: string) => `${color('green')}${msg}\x1b[0m`,
  info: (msg: string) => `${color('blue')}${msg}\x1b[0m`,
  debug: (msg: string) => `${color('gray')}${msg}\x1b[0m`,
  blue: (msg: string) => `${color('#008fff')}${msg}\x1b[0m`,
  green: (msg: string) => `${color('#51da51')}${msg}\x1b[0m`,
  pink: (msg: string) => `${color('#e796e7')}${msg}\x1b[0m`
};

export const ansi = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  colors: {
    blue: color('#1888df'),
    green: color('#51da51'),
    pink: color('#e796e7')
  }
};

const mdRenderer = marked.use(
  markedTerminal({
    firstHeading: (msg: string) => colorize.green(msg),
    heading: (msg: string) => colorize.green(msg),
    codespan: (msg: string) => colorize.green(msg),
    tableOptions: {
      style: {
        head: ['\x1b[0m']
      }
    }
  }) as unknown as MarkedExtension<string, string>
);

export function printMarkdown(md: string): void {
  process.stderr.write(mdRenderer.parse(md) as string);
}

/** Wraps plain text to a maximum column width; breaks at spaces, splits words longer than `maxWidth`. */
export function wrapText(text: string, maxWidth: number): string {
  if (maxWidth < 1) return text;
  const words = text.trim().split(/\s+/);
  if (words.length === 0 || (words.length === 1 && words[0] === '')) return '';
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    if (word.length > maxWidth) {
      if (line) {
        lines.push(line);
        line = '';
      }
      for (let i = 0; i < word.length; i += maxWidth) {
        lines.push(word.slice(i, i + maxWidth));
      }
      continue;
    }
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxWidth) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.join('\n');
}

function formatTypeText(t?: Type): string {
  if (!t) return '';
  return '`' + t.text + '`';
}

export function formatElementSummaries(elements: ElementSummary[]): string {
  let sb = '# Custom Elements\n\n';
  for (const elem of elements) {
    sb += `## \`<${elem.tagName}>\`\n\n`;
    if (elem.description) sb += elem.description + '\n\n';
  }
  return sb;
}

export function formatElement(elem: Declaration): string {
  let sb = `# \`<${elem.tagName}>\`\n\n`;
  if (elem.description) sb += elem.description + '\n\n';

  if (elem.attributes?.length) {
    sb +=
      '## Attributes\n\n' +
      renderFormattedMarkdownTable(
        ['Name', 'Type', 'Default', 'Description'],
        elem.attributes.map(attr => [
          `\`${attr.name}\``,
          `${formatTypeText(attr.type)}`,
          attr.default ?? '',
          attr.description ?? ''
        ])
      );
  }

  const fields = (elem.members ?? []).filter(m => m.kind === KindField);
  const methods = (elem.members ?? []).filter(m => m.kind === KindMethod);

  if (fields.length) {
    sb +=
      '## Properties\n\n' +
      renderFormattedMarkdownTable(
        ['Name', 'Type', 'Default', 'Description'],
        fields.map(prop => [
          `\`${prop.name}\``,
          `${formatTypeText(prop.type)}`,
          prop.default ?? '',
          prop.description ?? ''
        ])
      );
  }

  if (methods.length) {
    sb += '## Methods\n\n' + formatMethodsTable(methods);
  }

  if (elem.events?.length) {
    sb +=
      '## Events\n\n' +
      renderFormattedMarkdownTable(
        ['Name', 'Type', 'Description'],
        elem.events.map(event => [`\`${event.name}\``, `${formatTypeText(event.type)}`, event.description ?? ''])
      );
  }

  if (elem.slots?.length) {
    sb +=
      '## Slots\n\n' +
      renderFormattedMarkdownTable(
        ['Name', 'Description'],
        elem.slots.map(slot => [slot.name === '' ? '*(default)*' : '`' + slot.name + '`', slot.description ?? ''])
      );
  }

  if (elem.cssProperties?.length) {
    sb +=
      '## CSS Custom Properties\n\n' +
      renderFormattedMarkdownTable(
        ['Property', 'Default', 'Description'],
        elem.cssProperties.map(prop => [`\`${prop.name}\``, prop.default ?? '', prop.description ?? ''])
      );
  }

  if (elem.commands?.length) {
    sb +=
      '## Commands\n\n' +
      renderFormattedMarkdownTable(
        ['Name', 'Description'],
        elem.commands.map(cmd => [`\`${cmd.name}\``, cmd.description ?? ''])
      );
  }

  if (elem.cssParts?.length) {
    sb +=
      '## CSS Parts\n\n' +
      renderFormattedMarkdownTable(
        ['Part', 'Description'],
        elem.cssParts.map(part => [`\`${part.name}\``, part.description ?? ''])
      );
  }

  return sb;
}

export function renderFormattedMarkdownTable(headers: string[], rows: string[][]): string {
  let sb = '| ' + headers.join(' | ') + ' |\n';
  sb += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
  for (const cells of rows) {
    sb += '| ' + cells.map(cell => cell.replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ') + ' |\n';
  }
  return sb;
}

export function formatAttributesValue(attrs: Attribute[], tagName: string): string {
  let sb = `# \`<${tagName}>\` Attributes\n\n`;
  if (!attrs.length) return sb + 'No attributes defined.\n';
  sb += renderFormattedMarkdownTable(
    ['Name', 'Type', 'Default', 'Description'],
    attrs.map(attr => [`\`${attr.name}\``, `${formatTypeText(attr.type)}`, attr.default ?? '', attr.description ?? ''])
  );
  return sb;
}

export function formatMembersValue(members: Member[], tagName: string, title: string): string {
  let sb = `# \`<${tagName}>\` ${title}\n\n`;
  if (!members.length) return sb + `No ${title.toLowerCase()} defined.\n`;
  sb += renderFormattedMarkdownTable(
    ['Name', 'Type', 'Default', 'Description'],
    members.map(m => [`\`${m.name}\``, `${formatTypeText(m.type)}`, m.default ?? '', m.description ?? ''])
  );
  return sb;
}

function formatMethodsTable(methods: Member[]): string {
  return renderFormattedMarkdownTable(
    ['Name', 'Parameters', 'Return', 'Description'],
    methods.map(method => {
      const params = (method.parameters ?? []).map(p => {
        let s = p.name;
        if (p.type) s += ': ' + p.type.text;
        return s;
      });
      return [
        `\`${method.name}\``,
        params.length > 0 ? params.join(', ') : '',
        `\`${method.return?.type?.text ?? 'void'}\``,
        method.description ?? ''
      ];
    })
  );
}

export function formatMethodsValue(methods: Member[], tagName: string): string {
  let sb = `# \`<${tagName}>\` Methods\n\n`;
  if (!methods.length) return sb + 'No methods defined.\n';
  sb += formatMethodsTable(methods);
  return sb;
}

export function formatEventsValue(events: Event[], tagName: string): string {
  let sb = `# \`<${tagName}>\` Events\n\n`;
  if (!events.length) return sb + 'No events defined.\n';
  sb += renderFormattedMarkdownTable(
    ['Name', 'Type', 'Description'],
    events.map(event => [`\`${event.name}\``, `${formatTypeText(event.type)}`, event.description ?? ''])
  );
  return sb;
}

export function formatSlotsValue(slots: Slot[], tagName: string): string {
  let sb = `# \`<${tagName}>\` Slots\n\n`;
  if (!slots.length) return sb + 'No slots defined.\n';
  sb += renderFormattedMarkdownTable(
    ['Name', 'Description'],
    slots.map(slot => [slot.name === '' ? '*(default)*' : '`' + slot.name + '`', slot.description ?? ''])
  );
  return sb;
}

export function formatCSSPropertiesValue(props: CSSProperty[], tagName: string): string {
  let sb = `# \`<${tagName}>\` CSS Custom Properties\n\n`;
  if (!props.length) return sb + 'No CSS custom properties defined.\n';
  sb += renderFormattedMarkdownTable(
    ['Property', 'Default', 'Description'],
    props.map(prop => [`\`${prop.name}\``, prop.default ?? '', prop.description ?? ''])
  );
  return sb;
}

export function formatCommandsValue(commands: Command[], tagName: string): string {
  let sb = `# \`<${tagName}>\` Commands\n\n`;
  if (!commands.length) return sb + 'No commands defined.\n';
  sb += renderFormattedMarkdownTable(
    ['Name', 'Description'],
    commands.map(cmd => [`\`${cmd.name}\``, cmd.description ?? ''])
  );
  return sb;
}

export function formatCSSPartsValue(parts: CSSPart[], tagName: string): string {
  let sb = `# \`<${tagName}>\` CSS Parts\n\n`;
  if (!parts.length) return sb + 'No CSS parts defined.\n';
  sb += renderFormattedMarkdownTable(
    ['Part', 'Description'],
    parts.map(part => [`\`${part.name}\``, part.description ?? ''])
  );
  return sb;
}

export function formatPatternSummaries(summaries: PatternSummary[]): string {
  let sb = '# Patterns\n\n';
  for (const s of summaries) {
    sb += `## ${s.name}\n\n`;
    if (s.description) sb += s.description + '\n\n';
    if (s.tags?.length) sb += 'Tags: ' + s.tags.join(', ') + '\n\n';
  }
  return sb;
}

export function formatPattern(p: Pattern): string {
  let sb = `# ${p.name}\n\n${p.description}\n\n`;
  if (p.tags?.length) sb += '**Tags:** ' + p.tags.join(', ') + '\n\n';

  sb += '## Structure\n\n';
  if (p.structure.root) {
    sb += `**Root:** \`<${p.structure.root.tag}>\`\n\n`;
    if (p.structure.root.attributes?.length) {
      const attrs = p.structure.root.attributes.map(a => '`' + a.name + '`');
      sb += 'Required attributes: ' + attrs.join(', ') + '\n\n';
    }
  }

  if (p.structure.children?.length) {
    sb +=
      '### Children\n\n' +
      renderFormattedMarkdownTable(
        ['Rule', 'Element', 'Description'],
        p.structure.children.map(child => {
          let elem = '';
          if (child.element) {
            elem = '`<' + child.element.tag + '>`';
            if (child.element.slot) elem += ' (slot: ' + child.element.slot + ')';
          }
          if (child.options?.length) {
            elem = child.options.map(o => o.tag).join(', ');
          }
          return [child.rule, elem, child.description ?? ''];
        })
      );
  }

  if (p.structure.siblings?.length) {
    sb += '### Siblings\n\n';
    for (const sib of p.structure.siblings) {
      if (sib.description) sb += sib.description + '\n\n';
      sb += `- **Trigger:** \`<${sib.trigger.tag}>\`\n`;
      sb += `- **Target:** \`<${sib.target.tag}>\`\n`;
      if (sib.bindings?.length) {
        sb += '- **Bindings:**\n';
        for (const b of sib.bindings) {
          sb += `  - \`${b.triggerAttribute}\` (trigger) = \`${b.targetAttribute}\` (target)\n`;
        }
      }
      sb += '\n';
    }
  }

  if (p.examples?.length) {
    sb += '## Examples\n\n';
    for (const ex of p.examples) {
      sb += `### ${ex.name}\n\n`;
      if (ex.description) sb += ex.description + '\n\n';
      sb += '```html\n' + ex.html + '\n```\n\n';
    }
  }

  if (p.relatedPatterns?.length) {
    sb += '## Related Patterns\n\n';
    for (const rp of p.relatedPatterns) {
      sb += '- ' + rp + '\n';
    }
    sb += '\n';
  }

  return sb;
}

export function formatCustomAttributeSummaries(summaries: CustomAttributeSummary[]): string {
  let sb = '# Custom Attributes\n\n';
  for (const s of summaries) {
    sb += `## \`${s.name}\`\n\n`;
    if (s.description) sb += s.description + '\n\n';
    if (s.syntax) sb += 'Syntax: `' + s.syntax + '`\n\n';
    if (s.tags?.length) sb += 'Tags: ' + s.tags.join(', ') + '\n\n';
  }
  return sb;
}

export function formatCustomAttribute(a: CustomAttribute): string {
  let sb = `# \`${a.name}\`\n\n${a.description}\n\n`;
  if (a.syntax) sb += '**Syntax:** `' + a.syntax + '`\n\n';
  if (a.appliesTo?.all) {
    sb += '**Applies to:** all elements\n\n';
  } else if (a.appliesTo?.elements?.length) {
    sb += '**Applies to:** ' + a.appliesTo.elements.join(', ') + '\n\n';
  }
  if (a.tags?.length) sb += '**Tags:** ' + a.tags.join(', ') + '\n\n';

  if (a.tokenGroups?.length) {
    sb += '## Token Groups\n\n';
    for (const tg of a.tokenGroups) {
      sb += `### ${tg.name}\n\n`;
      if (tg.description) sb += tg.description + '\n\n';
      if (tg.rule) {
        let rule = tg.rule;
        if (tg.required) rule += ' (required)';
        sb += '**Rule:** ' + rule + '\n\n';
      }
      if (tg.requires?.length) sb += '**Requires:** ' + tg.requires.join(', ') + '\n\n';
      if (tg.values?.length) {
        sb += renderFormattedMarkdownTable(
          ['Value', 'Description'],
          tg.values.map(v => [`\`${v.value}\``, v.description ?? ''])
        );
      }
    }
  }

  if (a.examples?.length) {
    sb += '## Examples\n\n';
    for (const ex of a.examples) {
      sb += `### ${ex.name}\n\n`;
      if (ex.description) sb += ex.description + '\n\n';
      sb += '```html\n' + ex.html + '\n```\n\n';
    }
  }

  return sb;
}

export function formatCSSCustomPropertySummaries(summaries: CSSCustomPropertySummary[]): string {
  let sb = '# CSS Custom Properties\n\n';
  sb += renderFormattedMarkdownTable(
    ['Name', 'Type', 'Description', 'Tags'],
    summaries.map(s => [`\`${s.name}\``, s.type ?? '', s.description ?? '', s.tags?.join(', ') ?? ''])
  );
  return sb;
}

export function formatCSSCustomPropertyDetail(p: CSSCustomProperty): string {
  let sb = `# \`${p.name}\`\n\n`;
  if (p.description) sb += p.description + '\n\n';
  if (p.value) sb += '**Value:** `' + p.value + '`\n\n';
  if (p.type) sb += '**Type:** `' + p.type + '`\n\n';
  if (p.tags?.length) sb += '**Tags:** ' + p.tags.join(', ') + '\n\n';
  return sb;
}
