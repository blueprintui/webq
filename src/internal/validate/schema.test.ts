import { describe, test, expect } from 'bun:test';
import { isGlobalAttr, isCustomElement, parseEventName, parseAttrValues } from './schema.js';

describe('schema', () => {
  test('isGlobalAttr recognizes standard attrs', () => {
    expect(isGlobalAttr('class')).toBe(true);
    expect(isGlobalAttr('id')).toBe(true);
    expect(isGlobalAttr('style')).toBe(true);
    expect(isGlobalAttr('slot')).toBe(true);
  });

  test('isGlobalAttr recognizes data-* attrs', () => {
    expect(isGlobalAttr('data-testid')).toBe(true);
  });

  test('isGlobalAttr recognizes aria-* attrs', () => {
    expect(isGlobalAttr('aria-label')).toBe(true);
  });

  test('isGlobalAttr recognizes native event handlers', () => {
    expect(isGlobalAttr('onclick')).toBe(true);
    expect(isGlobalAttr('onchange')).toBe(true);
  });

  test('isGlobalAttr rejects unknown attrs', () => {
    expect(isGlobalAttr('custom-attr')).toBe(false);
    expect(isGlobalAttr('variant')).toBe(false);
  });

  test('isCustomElement checks for hyphen', () => {
    expect(isCustomElement('my-button')).toBe(true);
    expect(isCustomElement('div')).toBe(false);
  });

  test('parseEventName handles @ syntax', () => {
    const r = parseEventName('@click');
    expect(r.isEvent).toBe(true);
    expect(r.name).toBe('click');
  });

  test('parseEventName handles () syntax', () => {
    const r = parseEventName('(click)');
    expect(r.isEvent).toBe(true);
    expect(r.name).toBe('click');
  });

  test('parseEventName handles on- syntax', () => {
    const r = parseEventName('on-click');
    expect(r.isEvent).toBe(true);
    expect(r.name).toBe('click');
  });

  test('parseEventName handles native onevent syntax', () => {
    const r = parseEventName('onclick');
    expect(r.isEvent).toBe(true);
    expect(r.name).toBe('click');
  });

  test('parseEventName returns false for non-events', () => {
    const r = parseEventName('variant');
    expect(r.isEvent).toBe(false);
  });

  test('parseAttrValues parses string union', () => {
    const values = parseAttrValues("'a' | 'b' | 'c'");
    expect(values).toEqual(['a', 'b', 'c']);
  });

  test('parseAttrValues returns undefined for non-string types', () => {
    expect(parseAttrValues('string')).toBeUndefined();
    expect(parseAttrValues('boolean')).toBeUndefined();
  });

  test('parseAttrValues returns undefined for empty', () => {
    expect(parseAttrValues('')).toBeUndefined();
  });
});
