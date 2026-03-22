import { describe, test, expect } from 'bun:test';
import {
  wrapText,
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
  formatCSSCustomPropertyDetail,
  renderFormattedMarkdownTable
} from './format.js';
import type {
  Declaration,
  Attribute,
  Member,
  Event,
  Slot,
  CSSProperty,
  Command,
  CSSPart
} from '../internal/elements/types.js';

describe('formatElementSummaries', () => {
  test('formats multiple elements', () => {
    const md = formatElementSummaries([{ tagName: 'bp-button', description: 'A button' }, { tagName: 'bp-card' }]);
    expect(md).toContain('# Custom Elements');
    expect(md).toContain('<bp-button>');
    expect(md).toContain('A button');
    expect(md).toContain('<bp-card>');
  });

  test('formats empty list', () => {
    const md = formatElementSummaries([]);
    expect(md).toContain('# Custom Elements');
    expect(md).not.toContain('<');
  });
});

describe('formatElement', () => {
  test('formats element with all sections', () => {
    const elem: Declaration = {
      kind: 'class',
      name: 'BpButton',
      tagName: 'bp-button',
      description: 'A button',
      attributes: [{ name: 'variant', type: { text: 'string' }, default: "'primary'", description: 'The variant' }],
      members: [
        { kind: 'field', name: 'value', type: { text: 'string' }, default: "''", description: 'The value' },
        {
          kind: 'method',
          name: 'focus',
          description: 'Focus',
          parameters: [{ name: 'opts', type: { text: 'FocusOptions' } }],
          return: { type: { text: 'void' } }
        }
      ],
      events: [{ name: 'change', type: { text: 'CustomEvent' }, description: 'Fired on change' }],
      slots: [{ name: '', description: 'Default slot' }, { name: 'prefix' }],
      cssProperties: [{ name: '--bg', default: 'blue', description: 'Background' }],
      commands: [{ name: 'toggle', description: 'Toggle' }],
      cssParts: [{ name: 'base', description: 'Wrapper' }]
    };
    const md = formatElement(elem);
    expect(md).toContain('# `<bp-button>`');
    expect(md).toContain('## Attributes');
    expect(md).toContain('variant');
    expect(md).toContain('## Properties');
    expect(md).toContain('value');
    expect(md).toContain('## Methods');
    expect(md).toContain('focus');
    expect(md).toContain('## Events');
    expect(md).toContain('change');
    expect(md).toContain('## Slots');
    expect(md).toContain('*(default)*');
    expect(md).toContain('prefix');
    expect(md).toContain('## CSS Custom Properties');
    expect(md).toContain('--bg');
    expect(md).toContain('## Commands');
    expect(md).toContain('toggle');
    expect(md).toContain('## CSS Parts');
    expect(md).toContain('base');
  });

  test('formats element with no optional sections', () => {
    const elem: Declaration = { kind: 'class', name: 'BpEmpty', tagName: 'bp-empty' };
    const md = formatElement(elem);
    expect(md).toContain('# `<bp-empty>`');
    expect(md).not.toContain('## Attributes');
    expect(md).not.toContain('## Properties');
  });

  test('escapes pipe characters in table cells', () => {
    const elem: Declaration = {
      kind: 'class',
      name: 'BpTest',
      tagName: 'bp-test',
      attributes: [{ name: 'mode', type: { text: "'a' | 'b'" }, description: 'A|B mode' }]
    };
    const md = formatElement(elem);
    expect(md).toContain("'a' \\| 'b'");
    expect(md).toContain('A\\|B mode');
  });
});

describe('formatAttributesValue', () => {
  test('formats attributes table', () => {
    const attrs: Attribute[] = [{ name: 'size', type: { text: 'string' }, default: "'md'" }];
    const md = formatAttributesValue(attrs, 'bp-button');
    expect(md).toContain('`<bp-button>` Attributes');
    expect(md).toContain('size');
  });

  test('formats empty attributes', () => {
    const md = formatAttributesValue([], 'bp-button');
    expect(md).toContain('No attributes defined');
  });
});

describe('formatMembersValue', () => {
  test('formats members table', () => {
    const members: Member[] = [{ kind: 'field', name: 'value', type: { text: 'string' } }];
    const md = formatMembersValue(members, 'bp-input', 'Properties');
    expect(md).toContain('`<bp-input>` Properties');
    expect(md).toContain('value');
  });

  test('formats empty members', () => {
    const md = formatMembersValue([], 'bp-input', 'Properties');
    expect(md).toContain('No properties defined');
  });
});

describe('formatMethodsValue', () => {
  test('formats methods table', () => {
    const methods: Member[] = [
      { kind: 'method', name: 'focus', description: 'Focus element', return: { type: { text: 'void' } } }
    ];
    const md = formatMethodsValue(methods, 'bp-button');
    expect(md).toContain('`<bp-button>` Methods');
    expect(md).toContain('focus');
    expect(md).toContain('void');
  });

  test('formats empty methods', () => {
    const md = formatMethodsValue([], 'bp-button');
    expect(md).toContain('No methods defined');
  });
});

describe('formatEventsValue', () => {
  test('formats events table', () => {
    const events: Event[] = [{ name: 'change', type: { text: 'CustomEvent' } }];
    const md = formatEventsValue(events, 'bp-input');
    expect(md).toContain('`<bp-input>` Events');
    expect(md).toContain('change');
  });

  test('formats empty events', () => {
    const md = formatEventsValue([], 'bp-input');
    expect(md).toContain('No events defined');
  });
});

describe('formatSlotsValue', () => {
  test('formats slots table with default slot', () => {
    const slots: Slot[] = [{ name: '' }, { name: 'header' }];
    const md = formatSlotsValue(slots, 'bp-card');
    expect(md).toContain('*(default)*');
    expect(md).toContain('header');
  });

  test('formats empty slots', () => {
    const md = formatSlotsValue([], 'bp-card');
    expect(md).toContain('No slots defined');
  });
});

describe('formatCSSPropertiesValue', () => {
  test('formats CSS properties table', () => {
    const props: CSSProperty[] = [{ name: '--bg', default: 'red', description: 'Background' }];
    const md = formatCSSPropertiesValue(props, 'bp-button');
    expect(md).toContain('--bg');
    expect(md).toContain('red');
  });

  test('formats empty CSS properties', () => {
    const md = formatCSSPropertiesValue([], 'bp-button');
    expect(md).toContain('No CSS custom properties defined');
  });
});

describe('formatCommandsValue', () => {
  test('formats commands table', () => {
    const commands: Command[] = [{ name: 'open', description: 'Opens' }];
    const md = formatCommandsValue(commands, 'bp-dialog');
    expect(md).toContain('open');
  });

  test('formats empty commands', () => {
    const md = formatCommandsValue([], 'bp-dialog');
    expect(md).toContain('No commands defined');
  });
});

describe('formatCSSPartsValue', () => {
  test('formats CSS parts table', () => {
    const parts: CSSPart[] = [{ name: 'base', description: 'Root element' }];
    const md = formatCSSPartsValue(parts, 'bp-button');
    expect(md).toContain('base');
    expect(md).toContain('Root element');
  });

  test('formats empty CSS parts', () => {
    const md = formatCSSPartsValue([], 'bp-button');
    expect(md).toContain('No CSS parts defined');
  });
});

describe('formatPatternSummaries', () => {
  test('formats pattern summaries', () => {
    const md = formatPatternSummaries([{ name: 'form-field', description: 'A form field', tags: ['form'] }]);
    expect(md).toContain('# Patterns');
    expect(md).toContain('form-field');
    expect(md).toContain('Tags: form');
  });

  test('formats empty summaries', () => {
    const md = formatPatternSummaries([]);
    expect(md).toContain('# Patterns');
  });
});

describe('formatPattern', () => {
  test('formats pattern with structure and examples', () => {
    const md = formatPattern({
      name: 'form-field',
      description: 'A form field pattern',
      tags: ['form'],
      structure: {
        root: { tag: 'bp-field', attributes: [{ name: 'status' }] },
        children: [
          { rule: 'required', element: { tag: 'label' }, description: 'The label' },
          { rule: 'oneOf', options: [{ tag: 'bp-input' }, { tag: 'bp-select' }], description: 'The control' }
        ],
        siblings: [
          {
            trigger: { tag: 'bp-button' },
            target: { tag: 'bp-dialog' },
            description: 'Button opens dialog',
            bindings: [{ triggerAttribute: 'aria-controls', targetAttribute: 'id' }]
          }
        ]
      },
      examples: [{ name: 'Basic', description: 'Basic usage', html: '<bp-field><label>Name</label></bp-field>' }],
      relatedPatterns: ['dialog']
    });
    expect(md).toContain('# form-field');
    expect(md).toContain('**Root:** `<bp-field>`');
    expect(md).toContain('status');
    expect(md).toContain('### Children');
    expect(md).toContain('### Siblings');
    expect(md).toContain('aria-controls');
    expect(md).toContain('## Examples');
    expect(md).toContain('```html');
    expect(md).toContain('## Related Patterns');
    expect(md).toContain('dialog');
  });
});

describe('formatCustomAttributeSummaries', () => {
  test('formats attribute summaries', () => {
    const md = formatCustomAttributeSummaries([
      { name: 'bp-layout', description: 'Layout', syntax: 'token-list', tags: ['layout'] }
    ]);
    expect(md).toContain('# Custom Attributes');
    expect(md).toContain('bp-layout');
    expect(md).toContain('Syntax: `token-list`');
    expect(md).toContain('Tags: layout');
  });
});

describe('formatCustomAttribute', () => {
  test('formats attribute with token groups and examples', () => {
    const md = formatCustomAttribute({
      name: 'bp-layout',
      description: 'Layout utility',
      syntax: 'token-list',
      appliesTo: { all: true, elements: [] },
      tags: ['layout'],
      tokenGroups: [
        {
          name: 'type',
          description: 'Layout mode',
          rule: 'oneOf',
          required: true,
          values: [{ value: 'block', description: 'Vertical stack' }]
        }
      ],
      examples: [{ name: 'Basic', description: 'Basic usage', html: '<div bp-layout="block">content</div>' }]
    });
    expect(md).toContain('# `bp-layout`');
    expect(md).toContain('**Syntax:** `token-list`');
    expect(md).toContain('**Applies to:** all elements');
    expect(md).toContain('## Token Groups');
    expect(md).toContain('block');
    expect(md).toContain('(required)');
    expect(md).toContain('## Examples');
  });

  test('formats attribute with appliesTo elements', () => {
    const md = formatCustomAttribute({
      name: 'bp-text',
      description: 'Text utility',
      appliesTo: { all: false, elements: ['bp-card', 'bp-alert'] }
    });
    expect(md).toContain('**Applies to:** bp-card, bp-alert');
  });
});

describe('formatCSSCustomPropertySummaries', () => {
  test('formats property summaries as table', () => {
    const md = formatCSSCustomPropertySummaries([
      { name: '--bp-blue', description: 'Blue', type: 'color', tags: ['color'] }
    ]);
    expect(md).toContain('# CSS Custom Properties');
    expect(md).toContain('--bp-blue');
    expect(md).toContain('color');
    expect(md).toContain('Blue');
    expect(md).toContain('| Name |');
  });
});

describe('formatCSSCustomPropertyDetail', () => {
  test('formats property detail', () => {
    const md = formatCSSCustomPropertyDetail({
      name: '--bp-blue',
      description: 'Blue color',
      value: 'oklch(0.62 0.2 265)',
      type: 'color',
      tags: ['color']
    });
    expect(md).toContain('# `--bp-blue`');
    expect(md).toContain('Blue color');
    expect(md).toContain('**Value:** `oklch(0.62 0.2 265)`');
    expect(md).toContain('**Type:** `color`');
    expect(md).toContain('**Tags:** color');
  });
});

describe('wrapText', () => {
  test('returns empty for blank input', () => {
    expect(wrapText('', 80)).toBe('');
    expect(wrapText('   ', 80)).toBe('');
  });

  test('wraps at word boundaries', () => {
    const out = wrapText('one two three four five six', 10);
    expect(out).toBe('one two\nthree four\nfive six');
  });

  test('splits words longer than maxWidth', () => {
    expect(wrapText('abcdefghij', 4)).toBe('abcd\nefgh\nij');
  });
});

describe('renderFormattedMarkdownTable', () => {
  test('outputs valid markdown table', () => {
    const result = renderFormattedMarkdownTable(
      ['Name', 'Value'],
      [
        ['a', 'one'],
        ['longer', 'two']
      ]
    );
    const lines = result.trim().split('\n');
    expect(lines[0]).toBe('| Name | Value |');
    expect(lines[1]).toBe('| --- | --- |');
    expect(lines[2]).toBe('| a | one |');
    expect(lines[3]).toBe('| longer | two |');
  });

  test('escapes pipe characters in cells', () => {
    const result = renderFormattedMarkdownTable(['Type'], [["'a' | 'b'"]]);
    expect(result).toContain("'a' \\| 'b'");
  });

  test('replaces newlines in cells', () => {
    const result = renderFormattedMarkdownTable(['Desc'], [['line1\nline2']]);
    expect(result).toContain('line1 line2');
  });

  test('renders header-only table with no rows', () => {
    const result = renderFormattedMarkdownTable(['Name', 'Type'], []);
    expect(result).toContain('| Name | Type |');
    expect(result).toContain('| --- | --- |');
  });
});
