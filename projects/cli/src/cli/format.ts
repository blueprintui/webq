import { marked } from 'marked';
import type { MarkedExtension } from 'marked';
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
  error: (msg: string): string => `${color('#e62f2f')}${msg}\x1b[0m`,
  warning: (msg: string): string => `${color('yellow')}${msg}\x1b[0m`,
  success: (msg: string): string => `${color('green')}${msg}\x1b[0m`,
  info: (msg: string): string => `${color('blue')}${msg}\x1b[0m`,
  debug: (msg: string): string => `${color('gray')}${msg}\x1b[0m`,
  blue: (msg: string): string => `${color('#008fff')}${msg}\x1b[0m`,
  green: (msg: string): string => `${color('#51da51')}${msg}\x1b[0m`,
  pink: (msg: string): string => `${color('#e796e7')}${msg}\x1b[0m`
};

const mdRenderer = marked.use(
  markedTerminal({
    firstHeading: (msg: string): string => colorize.green(msg),
    heading: (msg: string): string => colorize.green(msg),
    codespan: (msg: string): string => colorize.green(msg),
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

function splitLongWord(word: string, maxWidth: number): string[] {
  const chunks: string[] = [];
  for (let idx = 0; idx < word.length; idx += maxWidth) {
    chunks.push(word.slice(idx, idx + maxWidth));
  }
  return chunks;
}

function appendWord(line: string, word: string, maxWidth: number): { line: string; flush?: string } {
  const next = line ? `${line} ${word}` : word;
  if (next.length <= maxWidth) return { line: next };
  return { line: word, flush: line || undefined };
}

function addWordToLines(line: string, word: string, maxWidth: number, lines: string[]): string {
  if (word.length > maxWidth) {
    if (line) lines.push(line);
    lines.push(...splitLongWord(word, maxWidth));
    return '';
  }
  const result = appendWord(line, word, maxWidth);
  if (result.flush) lines.push(result.flush);
  return result.line;
}

/** Wraps plain text to a maximum column width; breaks at spaces, splits words longer than `maxWidth`. */
export function wrapText(text: string, maxWidth: number): string {
  if (maxWidth < 1) return text;
  const words = text.trim().split(/\s+/);
  if (words.length === 0 || (words.length === 1 && words[0] === '')) return '';
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    line = addWordToLines(line, word, maxWidth, lines);
  }
  if (line) lines.push(line);
  return lines.join('\n');
}

function formatTypeText(type?: Type): string {
  if (!type) return '';
  return '`' + type.text + '`';
}

export function formatElementSummaries(elements: ElementSummary[]): string {
  let sb = '# Custom Elements\n\n';
  for (const elem of elements) {
    sb += `## \`<${elem.tagName}>\`\n\n`;
    if (elem.description) sb += elem.description + '\n\n';
  }
  return sb;
}

function attributesSection(attrs: Attribute[] | undefined): string {
  if (!attrs?.length) return '';
  return (
    '## Attributes\n\n' +
    renderFormattedMarkdownTable(
      ['Name', 'Type', 'Default', 'Description'],
      attrs.map(attr => [
        `\`${attr.name}\``,
        `${formatTypeText(attr.type)}`,
        attr.default ?? '',
        attr.description ?? ''
      ])
    )
  );
}

function propertiesSection(fields: Member[]): string {
  if (!fields.length) return '';
  return (
    '## Properties\n\n' +
    renderFormattedMarkdownTable(
      ['Name', 'Type', 'Default', 'Description'],
      fields.map(prop => [
        `\`${prop.name}\``,
        `${formatTypeText(prop.type)}`,
        prop.default ?? '',
        prop.description ?? ''
      ])
    )
  );
}

function methodsSection(methods: Member[]): string {
  if (!methods.length) return '';
  return '## Methods\n\n' + formatMethodsTable(methods);
}

function eventsSection(events: Event[] | undefined): string {
  if (!events?.length) return '';
  return (
    '## Events\n\n' +
    renderFormattedMarkdownTable(
      ['Name', 'Type', 'Description'],
      events.map(event => [`\`${event.name}\``, `${formatTypeText(event.type)}`, event.description ?? ''])
    )
  );
}

function slotsSection(slots: Slot[] | undefined): string {
  if (!slots?.length) return '';
  return (
    '## Slots\n\n' +
    renderFormattedMarkdownTable(
      ['Name', 'Description'],
      slots.map(slot => [slot.name === '' ? '*(default)*' : '`' + slot.name + '`', slot.description ?? ''])
    )
  );
}

function cssPropertiesSection(props: CSSProperty[] | undefined): string {
  if (!props?.length) return '';
  return (
    '## CSS Custom Properties\n\n' +
    renderFormattedMarkdownTable(
      ['Property', 'Default', 'Description'],
      props.map(prop => [`\`${prop.name}\``, prop.default ?? '', prop.description ?? ''])
    )
  );
}

function commandsSection(commands: Command[] | undefined): string {
  if (!commands?.length) return '';
  return (
    '## Commands\n\n' +
    renderFormattedMarkdownTable(
      ['Name', 'Description'],
      commands.map(cmd => [`\`${cmd.name}\``, cmd.description ?? ''])
    )
  );
}

function cssPartsSection(parts: CSSPart[] | undefined): string {
  if (!parts?.length) return '';
  return (
    '## CSS Parts\n\n' +
    renderFormattedMarkdownTable(
      ['Part', 'Description'],
      parts.map(part => [`\`${part.name}\``, part.description ?? ''])
    )
  );
}

export function formatElement(elem: Declaration): string {
  let sb = `# \`<${elem.tagName}>\`\n\n`;
  if (elem.description) sb += elem.description + '\n\n';

  const fields = (elem.members ?? []).filter(member => member.kind === KindField);
  const methods = (elem.members ?? []).filter(member => member.kind === KindMethod);

  sb += attributesSection(elem.attributes);
  sb += propertiesSection(fields);
  sb += methodsSection(methods);
  sb += eventsSection(elem.events);
  sb += slotsSection(elem.slots);
  sb += cssPropertiesSection(elem.cssProperties);
  sb += commandsSection(elem.commands);
  sb += cssPartsSection(elem.cssParts);

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
    members.map(member => [
      `\`${member.name}\``,
      `${formatTypeText(member.type)}`,
      member.default ?? '',
      member.description ?? ''
    ])
  );
  return sb;
}

function formatMethodsTable(methods: Member[]): string {
  return renderFormattedMarkdownTable(
    ['Name', 'Parameters', 'Return', 'Description'],
    methods.map(method => {
      const params = (method.parameters ?? []).map(param => {
        let str = param.name;
        if (param.type) str += ': ' + param.type.text;
        return str;
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
  for (const summary of summaries) {
    sb += `## ${summary.name}\n\n`;
    if (summary.description) sb += summary.description + '\n\n';
    if (summary.tags?.length) sb += 'Tags: ' + summary.tags.join(', ') + '\n\n';
  }
  return sb;
}

function patternRootSection(root: Pattern['structure']['root']): string {
  if (!root) return '';
  let sb = `**Root:** \`<${root.tag}>\`\n\n`;
  if (root.attributes?.length) {
    const attrs = root.attributes.map(attr => '`' + attr.name + '`');
    sb += 'Required attributes: ' + attrs.join(', ') + '\n\n';
  }
  return sb;
}

function patternChildElement(child: NonNullable<Pattern['structure']['children']>[number]): string {
  if (child.options?.length) return child.options.map(opt => opt.tag).join(', ');
  if (!child.element) return '';
  let elem = '`<' + child.element.tag + '>`';
  if (child.element.slot) elem += ' (slot: ' + child.element.slot + ')';
  return elem;
}

function patternChildrenSection(children: Pattern['structure']['children']): string {
  if (!children?.length) return '';
  return (
    '### Children\n\n' +
    renderFormattedMarkdownTable(
      ['Rule', 'Element', 'Description'],
      children.map(child => [child.rule, patternChildElement(child), child.description ?? ''])
    )
  );
}

function patternSiblingBindings(bindings: NonNullable<Pattern['structure']['siblings']>[number]['bindings']): string {
  if (!bindings?.length) return '';
  let sb = '- **Bindings:**\n';
  for (const binding of bindings) {
    sb += `  - \`${binding.triggerAttribute}\` (trigger) = \`${binding.targetAttribute}\` (target)\n`;
  }
  return sb;
}

function patternSiblingsSection(siblings: Pattern['structure']['siblings']): string {
  if (!siblings?.length) return '';
  let sb = '### Siblings\n\n';
  for (const sib of siblings) {
    if (sib.description) sb += sib.description + '\n\n';
    sb += `- **Trigger:** \`<${sib.trigger.tag}>\`\n`;
    sb += `- **Target:** \`<${sib.target.tag}>\`\n`;
    sb += patternSiblingBindings(sib.bindings);
    sb += '\n';
  }
  return sb;
}

function patternExamplesSection(examples: Pattern['examples']): string {
  if (!examples?.length) return '';
  let sb = '## Examples\n\n';
  for (const ex of examples) {
    sb += `### ${ex.name}\n\n`;
    if (ex.description) sb += ex.description + '\n\n';
    sb += '```html\n' + ex.html + '\n```\n\n';
  }
  return sb;
}

function patternRelatedSection(related: Pattern['relatedPatterns']): string {
  if (!related?.length) return '';
  let sb = '## Related Patterns\n\n';
  for (const rp of related) {
    sb += '- ' + rp + '\n';
  }
  return sb + '\n';
}

export function formatPattern(pattern: Pattern): string {
  let sb = `# ${pattern.name}\n\n${pattern.description}\n\n`;
  if (pattern.tags?.length) sb += '**Tags:** ' + pattern.tags.join(', ') + '\n\n';

  sb += '## Structure\n\n';
  sb += patternRootSection(pattern.structure.root);
  sb += patternChildrenSection(pattern.structure.children);
  sb += patternSiblingsSection(pattern.structure.siblings);
  sb += patternExamplesSection(pattern.examples);
  sb += patternRelatedSection(pattern.relatedPatterns);

  return sb;
}

export function formatCustomAttributeSummaries(summaries: CustomAttributeSummary[]): string {
  let sb = '# Custom Attributes\n\n';
  for (const summary of summaries) {
    sb += `## \`${summary.name}\`\n\n`;
    if (summary.description) sb += summary.description + '\n\n';
    if (summary.syntax) sb += 'Syntax: `' + summary.syntax + '`\n\n';
    if (summary.tags?.length) sb += 'Tags: ' + summary.tags.join(', ') + '\n\n';
  }
  return sb;
}

function appliesToSection(appliesTo: CustomAttribute['appliesTo']): string {
  if (appliesTo?.all) return '**Applies to:** all elements\n\n';
  if (appliesTo?.elements?.length) return '**Applies to:** ' + appliesTo.elements.join(', ') + '\n\n';
  return '';
}

function tokenGroup(tg: NonNullable<CustomAttribute['tokenGroups']>[number]): string {
  let sb = `### ${tg.name}\n\n`;
  if (tg.description) sb += tg.description + '\n\n';
  if (tg.rule) {
    const rule = tg.required ? `${tg.rule} (required)` : tg.rule;
    sb += '**Rule:** ' + rule + '\n\n';
  }
  if (tg.requires?.length) sb += '**Requires:** ' + tg.requires.join(', ') + '\n\n';
  if (tg.values?.length) {
    sb += renderFormattedMarkdownTable(
      ['Value', 'Description'],
      tg.values.map(value => [`\`${value.value}\``, value.description ?? ''])
    );
  }
  return sb;
}

function tokenGroupsSection(groups: CustomAttribute['tokenGroups']): string {
  if (!groups?.length) return '';
  let sb = '## Token Groups\n\n';
  for (const tg of groups) sb += tokenGroup(tg);
  return sb;
}

function customAttrExamplesSection(examples: CustomAttribute['examples']): string {
  if (!examples?.length) return '';
  let sb = '## Examples\n\n';
  for (const ex of examples) {
    sb += `### ${ex.name}\n\n`;
    if (ex.description) sb += ex.description + '\n\n';
    sb += '```html\n' + ex.html + '\n```\n\n';
  }
  return sb;
}

export function formatCustomAttribute(attr: CustomAttribute): string {
  let sb = `# \`${attr.name}\`\n\n${attr.description}\n\n`;
  if (attr.syntax) sb += '**Syntax:** `' + attr.syntax + '`\n\n';
  sb += appliesToSection(attr.appliesTo);
  if (attr.tags?.length) sb += '**Tags:** ' + attr.tags.join(', ') + '\n\n';
  sb += tokenGroupsSection(attr.tokenGroups);
  sb += customAttrExamplesSection(attr.examples);
  return sb;
}

export function formatCSSCustomPropertySummaries(summaries: CSSCustomPropertySummary[]): string {
  let sb = '# CSS Custom Properties\n\n';
  sb += renderFormattedMarkdownTable(
    ['Name', 'Type', 'Description', 'Tags'],
    summaries.map(summary => [
      `\`${summary.name}\``,
      summary.type ?? '',
      summary.description ?? '',
      summary.tags?.join(', ') ?? ''
    ])
  );
  return sb;
}

export function formatCSSCustomPropertyDetail(prop: CSSCustomProperty): string {
  let sb = `# \`${prop.name}\`\n\n`;
  if (prop.description) sb += prop.description + '\n\n';
  if (prop.value) sb += '**Value:** `' + prop.value + '`\n\n';
  if (prop.type) sb += '**Type:** `' + prop.type + '`\n\n';
  if (prop.tags?.length) sb += '**Tags:** ' + prop.tags.join(', ') + '\n\n';
  return sb;
}
