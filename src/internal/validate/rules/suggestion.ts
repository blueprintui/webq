export function formatSuggestion(names: string[], noneLabel: string, validLabel: string): string {
  if (names.length === 0) {
    return `This element has no defined ${noneLabel}.`;
  }
  return `${validLabel}: ${names.join(', ')}`;
}
