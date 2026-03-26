import type { ESLint } from 'eslint';
import noUnknownAttr from './rules/no-unknown-attr.js';
import noUnknownSlot from './rules/no-unknown-slot.js';
import noDeprecatedElement from './rules/no-deprecated-element.js';
import noDeprecatedAttr from './rules/no-deprecated-attr.js';
import noUnknownAttrValue from './rules/no-unknown-attr-value.js';
import noUnknownElement from './rules/no-unknown-element.js';
import noUnknownEvent from './rules/no-unknown-event.js';
import noUnknownCommand from './rules/no-unknown-command.js';
import noDeprecatedSlot from './rules/no-deprecated-slot.js';
import noDeprecatedEvent from './rules/no-deprecated-event.js';
import noBooleanAttrValue from './rules/no-boolean-attr-value.js';
import noDeprecatedCommand from './rules/no-deprecated-command.js';
import noUnknownCssPart from './rules/no-unknown-css-part.js';
import noUnknownCssCustomProperty from './rules/no-unknown-css-custom-property.js';
import noUnknownStyleValue from './rules/no-unknown-style-value.js';
import noUnknownCustomAttrValue from './rules/no-unknown-custom-attr-value.js';
import noMissingRequiredChild from './rules/no-missing-required-child.js';
import noMissingSiblingBinding from './rules/no-missing-sibling-binding.js';

const rules = {
  'no-unknown-element': noUnknownElement,
  'no-unknown-attr': noUnknownAttr,
  'no-unknown-attr-value': noUnknownAttrValue,
  'no-unknown-event': noUnknownEvent,
  'no-unknown-command': noUnknownCommand,
  'no-unknown-slot': noUnknownSlot,
  'no-unknown-css-part': noUnknownCssPart,
  'no-unknown-css-custom-property': noUnknownCssCustomProperty,
  'no-unknown-style-value': noUnknownStyleValue,
  'no-unknown-custom-attr-value': noUnknownCustomAttrValue,
  'no-deprecated-element': noDeprecatedElement,
  'no-deprecated-attr': noDeprecatedAttr,
  'no-deprecated-slot': noDeprecatedSlot,
  'no-deprecated-event': noDeprecatedEvent,
  'no-deprecated-command': noDeprecatedCommand,
  'no-boolean-attr-value': noBooleanAttrValue,
  'no-missing-required-child': noMissingRequiredChild,
  'no-missing-sibling-binding': noMissingSiblingBinding
};

const plugin = {
  rules,
  configs: {} as Record<string, ESLint.ConfigData>
} satisfies ESLint.Plugin;

export interface RecommendedOptions {
  path: string;
}

export function recommended(options: RecommendedOptions) {
  const webqOption = [{ path: options.path }];
  return {
    plugins: { webq: plugin },
    rules: {
      'webq/no-unknown-element': ['error', ...webqOption],
      'webq/no-unknown-attr': ['error', ...webqOption],
      'webq/no-unknown-attr-value': ['error', ...webqOption],
      'webq/no-unknown-event': ['error', ...webqOption],
      'webq/no-unknown-command': ['error', ...webqOption],
      'webq/no-unknown-slot': ['error', ...webqOption],
      'webq/no-unknown-css-part': ['error', ...webqOption],
      'webq/no-unknown-css-custom-property': ['error', ...webqOption],
      'webq/no-unknown-style-value': ['warn', ...webqOption],
      'webq/no-unknown-custom-attr-value': ['warn', ...webqOption],
      'webq/no-boolean-attr-value': ['warn', ...webqOption],
      'webq/no-deprecated-element': ['warn', ...webqOption],
      'webq/no-deprecated-attr': ['warn', ...webqOption],
      'webq/no-deprecated-slot': ['warn', ...webqOption],
      'webq/no-deprecated-event': ['warn', ...webqOption],
      'webq/no-deprecated-command': ['warn', ...webqOption],
      'webq/no-missing-required-child': ['error', ...webqOption],
      'webq/no-missing-sibling-binding': ['error', ...webqOption]
    }
  } as const;
}

export default plugin;
