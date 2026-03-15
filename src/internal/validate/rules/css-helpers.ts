export const cssRuleBlockRegex = /([\w-]+(?:::[\w-]+(?:\([^)]*\))?)?)\s*\{([^}]*)\}/g;
export const cssCustomPropRegex = /(--[\w-]+)\s*:/g;
export const cssVarRefRegex = /var\(\s*(--[\w-]+)/g;
export const tagNameSplitRegex = /[:.#[\s]/;

export function extractTagName(selector: string): string {
  const parts = selector.split(tagNameSplitRegex);
  return parts[0] || selector;
}
