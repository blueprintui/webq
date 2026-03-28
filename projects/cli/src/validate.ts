// Side-effect: register all 18 built-in validation rules
import './internal/validate/rules/index.js';

export { verify, allRules, getRule } from './internal/validate/validate.js';
export { parseHTML } from './internal/validate/html.js';
export { Severity } from './internal/validate/types.js';
export type { LintResult, LintMessage, ValidateConfig, VerifyStores, Rule } from './internal/validate/types.js';

export { Store } from './internal/elements/store.js';
export { parseManifest, parseManifestFromString } from './internal/elements/parser.js';
export { resolvePaths } from './internal/elements/resolver.js';
export type { Manifest } from './internal/elements/types.js';

export { PatternStore } from './internal/patterns/store.js';
export { normalizePatternsFile } from './internal/patterns/parser.js';
export { CustomAttributeStore } from './internal/attributes/store.js';
export { normalizeCustomAttributesFile } from './internal/attributes/parser.js';
export { CustomStyleStore } from './internal/styles/store.js';
