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

function escapeTableCell(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function formatTypeText(t?: Type): string {
  if (!t) return '';
  return '`' + escapeTableCell(t.text) + '`';
}

export function formatElementSummaries(elements: ElementSummary[]): string {
  let sb = '# Custom Elements\n\n';
  for (const elem of elements) {
    sb += `### \`<${elem.tagName}>\`\n\n`;
    if (elem.description) sb += elem.description + '\n\n';
  }
  return sb;
}

export function formatElement(elem: Declaration): string {
  let sb = `# \`<${elem.tagName}>\`\n\n`;
  if (elem.description) sb += elem.description + '\n\n';

  if (elem.attributes?.length) {
    sb += '## Attributes\n\n| Name | Type | Default | Description |\n|------|------|---------|-------------|\n';
    for (const attr of elem.attributes) {
      sb += `| \`${attr.name}\` | ${formatTypeText(attr.type)} | ${escapeTableCell(attr.default ?? '')} | ${escapeTableCell(attr.description ?? '')} |\n`;
    }
    sb += '\n';
  }

  const fields = (elem.members ?? []).filter(m => m.kind === KindField);
  const methods = (elem.members ?? []).filter(m => m.kind === KindMethod);

  if (fields.length) {
    sb += '## Properties\n\n| Name | Type | Default | Description |\n|------|------|---------|-------------|\n';
    for (const prop of fields) {
      sb += `| \`${prop.name}\` | ${formatTypeText(prop.type)} | ${escapeTableCell(prop.default ?? '')} | ${escapeTableCell(prop.description ?? '')} |\n`;
    }
    sb += '\n';
  }

  if (methods.length) {
    sb += '## Methods\n\n' + formatMethodsTable(methods);
  }

  if (elem.events?.length) {
    sb += '## Events\n\n| Name | Type | Description |\n|------|------|-------------|\n';
    for (const event of elem.events) {
      sb += `| \`${event.name}\` | ${formatTypeText(event.type)} | ${escapeTableCell(event.description ?? '')} |\n`;
    }
    sb += '\n';
  }

  if (elem.slots?.length) {
    sb += '## Slots\n\n| Name | Description |\n|------|-------------|\n';
    for (const slot of elem.slots) {
      const name = slot.name === '' ? '*(default)*' : '`' + slot.name + '`';
      sb += `| ${name} | ${escapeTableCell(slot.description ?? '')} |\n`;
    }
    sb += '\n';
  }

  if (elem.cssProperties?.length) {
    sb += '## CSS Custom Properties\n\n| Property | Default | Description |\n|----------|---------|-------------|\n';
    for (const prop of elem.cssProperties) {
      sb += `| \`${prop.name}\` | ${escapeTableCell(prop.default ?? '')} | ${escapeTableCell(prop.description ?? '')} |\n`;
    }
    sb += '\n';
  }

  if (elem.commands?.length) {
    sb += '## Commands\n\n| Name | Description |\n|------|-------------|\n';
    for (const cmd of elem.commands) {
      sb += `| \`${cmd.name}\` | ${escapeTableCell(cmd.description ?? '')} |\n`;
    }
    sb += '\n';
  }

  if (elem.cssParts?.length) {
    sb += '## CSS Parts\n\n| Part | Description |\n|------|-------------|\n';
    for (const part of elem.cssParts) {
      sb += `| \`${part.name}\` | ${escapeTableCell(part.description ?? '')} |\n`;
    }
    sb += '\n';
  }

  return sb;
}

export function formatAttributesValue(attrs: Attribute[], tagName: string): string {
  let sb = `# \`<${tagName}>\` Attributes\n\n`;
  if (!attrs.length) return sb + 'No attributes defined.\n';
  sb += '| Name | Type | Default | Description |\n|------|------|---------|-------------|\n';
  for (const attr of attrs) {
    sb += `| \`${attr.name}\` | ${formatTypeText(attr.type)} | ${escapeTableCell(attr.default ?? '')} | ${escapeTableCell(attr.description ?? '')} |\n`;
  }
  return sb;
}

export function formatMembersValue(members: Member[], tagName: string, title: string): string {
  let sb = `# \`<${tagName}>\` ${title}\n\n`;
  if (!members.length) return sb + `No ${title.toLowerCase()} defined.\n`;
  sb += '| Name | Type | Default | Description |\n|------|------|---------|-------------|\n';
  for (const m of members) {
    sb += `| \`${m.name}\` | ${formatTypeText(m.type)} | ${escapeTableCell(m.default ?? '')} | ${escapeTableCell(m.description ?? '')} |\n`;
  }
  return sb;
}

function formatMethodsTable(methods: Member[]): string {
  let sb = '| Name | Parameters | Return | Description |\n|------|------------|--------|-------------|\n';
  for (const method of methods) {
    const params = (method.parameters ?? []).map(p => {
      let s = p.name;
      if (p.type) s += ': ' + p.type.text;
      return s;
    });
    const paramText = params.length > 0 ? escapeTableCell(params.join(', ')) : '';
    const returnType = method.return?.type?.text ?? 'void';
    sb += `| \`${method.name}\` | ${paramText} | \`${returnType}\` | ${escapeTableCell(method.description ?? '')} |\n`;
  }
  sb += '\n';
  return sb;
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
  sb += '| Name | Type | Description |\n|------|------|-------------|\n';
  for (const event of events) {
    sb += `| \`${event.name}\` | ${formatTypeText(event.type)} | ${escapeTableCell(event.description ?? '')} |\n`;
  }
  return sb;
}

export function formatSlotsValue(slots: Slot[], tagName: string): string {
  let sb = `# \`<${tagName}>\` Slots\n\n`;
  if (!slots.length) return sb + 'No slots defined.\n';
  sb += '| Name | Description |\n|------|-------------|\n';
  for (const slot of slots) {
    const name = slot.name === '' ? '*(default)*' : '`' + slot.name + '`';
    sb += `| ${name} | ${escapeTableCell(slot.description ?? '')} |\n`;
  }
  return sb;
}

export function formatCSSPropertiesValue(props: CSSProperty[], tagName: string): string {
  let sb = `# \`<${tagName}>\` CSS Custom Properties\n\n`;
  if (!props.length) return sb + 'No CSS custom properties defined.\n';
  sb += '| Property | Default | Description |\n|----------|---------|-------------|\n';
  for (const prop of props) {
    sb += `| \`${prop.name}\` | ${escapeTableCell(prop.default ?? '')} | ${escapeTableCell(prop.description ?? '')} |\n`;
  }
  return sb;
}

export function formatCommandsValue(commands: Command[], tagName: string): string {
  let sb = `# \`<${tagName}>\` Commands\n\n`;
  if (!commands.length) return sb + 'No commands defined.\n';
  sb += '| Name | Description |\n|------|-------------|\n';
  for (const cmd of commands) {
    sb += `| \`${cmd.name}\` | ${escapeTableCell(cmd.description ?? '')} |\n`;
  }
  return sb;
}

export function formatCSSPartsValue(parts: CSSPart[], tagName: string): string {
  let sb = `# \`<${tagName}>\` CSS Parts\n\n`;
  if (!parts.length) return sb + 'No CSS parts defined.\n';
  sb += '| Part | Description |\n|------|-------------|\n';
  for (const part of parts) {
    sb += `| \`${part.name}\` | ${escapeTableCell(part.description ?? '')} |\n`;
  }
  return sb;
}

export function formatPatternSummaries(summaries: PatternSummary[]): string {
  let sb = '# Patterns\n\n';
  for (const s of summaries) {
    sb += `### ${s.name}\n\n`;
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
    sb += '### Children\n\n| Rule | Element | Description |\n|------|---------|-------------|\n';
    for (const child of p.structure.children) {
      let elem = '';
      if (child.element) {
        elem = '`<' + child.element.tag + '>`';
        if (child.element.slot) elem += ' (slot: ' + child.element.slot + ')';
      }
      if (child.options?.length) {
        elem = child.options.map(o => o.tag).join(', ');
      }
      sb += `| ${child.rule} | ${escapeTableCell(elem)} | ${escapeTableCell(child.description ?? '')} |\n`;
    }
    sb += '\n';
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
    sb += `### \`${s.name}\`\n\n`;
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
        sb += '| Value | Description |\n|-------|-------------|\n';
        for (const v of tg.values) {
          sb += `| \`${v.value}\` | ${escapeTableCell(v.description ?? '')} |\n`;
        }
        sb += '\n';
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
  for (const s of summaries) {
    sb += `### \`${s.name}\`\n\n`;
    if (s.description) sb += s.description + '\n\n';
    if (s.type) sb += 'Type: `' + s.type + '`\n\n';
    if (s.tags?.length) sb += 'Tags: ' + s.tags.join(', ') + '\n\n';
  }
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
