import { describe, test, expect } from 'bun:test';
import { resolveCommandPairs } from './command-helper.js';
import { parseHTML } from '../html.js';
import { makeStore } from './test-helper.js';

describe('resolveCommandPairs', () => {
  test('resolves command pair when button has command+commandfor pointing to a custom element by id', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button id="btn1"></bp-button><button command="--open" commandfor="btn1">Open</button>');
    const pairs = resolveCommandPairs(doc, store);
    expect(pairs.length).toBe(1);
    expect(pairs[0].commandAttr.name).toBe('command');
    expect(pairs[0].commandAttr.value).toBe('--open');
    expect(pairs[0].targetTag).toBe('bp-button');
    expect(pairs[0].declaration.tagName).toBe('bp-button');
  });

  test('returns empty when no command attributes present', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button id="btn1"></bp-button><button>Click</button>');
    const pairs = resolveCommandPairs(doc, store);
    expect(pairs).toEqual([]);
  });

  test('returns empty when commandfor references non-existent id', () => {
    const store = makeStore();
    const doc = parseHTML('<button command="--open" commandfor="missing">Open</button>');
    const pairs = resolveCommandPairs(doc, store);
    expect(pairs).toEqual([]);
  });

  test('returns empty when target is not a custom element', () => {
    const store = makeStore();
    const doc = parseHTML('<div id="target"></div><button command="--open" commandfor="target">Open</button>');
    const pairs = resolveCommandPairs(doc, store);
    expect(pairs).toEqual([]);
  });

  test('returns empty when target custom element is not in the store', () => {
    const store = makeStore();
    const doc = parseHTML(
      '<unknown-element id="unk"></unknown-element><button command="--open" commandfor="unk">Open</button>'
    );
    const pairs = resolveCommandPairs(doc, store);
    expect(pairs).toEqual([]);
  });

  test('returns empty when element has command but no commandfor', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button id="btn1"></bp-button><button command="--open">Open</button>');
    const pairs = resolveCommandPairs(doc, store);
    expect(pairs).toEqual([]);
  });

  test('returns empty when element has commandfor but no command', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button id="btn1"></bp-button><button commandfor="btn1">Open</button>');
    const pairs = resolveCommandPairs(doc, store);
    expect(pairs).toEqual([]);
  });
});
