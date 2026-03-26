import { describe, test, expect } from 'bun:test';
import { formatSuggestion } from './suggestion.js';

describe('formatSuggestion', () => {
  test('returns none message when names is empty', () => {
    expect(formatSuggestion([], 'attributes', 'Valid attributes')).toBe('This element has no defined attributes.');
  });

  test('returns valid names when names is non-empty', () => {
    expect(formatSuggestion(['a', 'b', 'c'], 'attributes', 'Valid attributes')).toBe('Valid attributes: a, b, c');
  });

  test('returns single name', () => {
    expect(formatSuggestion(['only'], 'slots', 'Valid slots')).toBe('Valid slots: only');
  });
});
