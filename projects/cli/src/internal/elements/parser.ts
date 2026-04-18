import { readFile } from 'fs/promises';
import type { Manifest } from './types.js';

export async function parseManifest(path: string): Promise<Manifest> {
  const data = await readFile(path, 'utf-8');
  return parseManifestFromString(data);
}

export function parseManifestFromString(json: string): Manifest {
  return JSON.parse(json) as Manifest;
}

export function validate(manifest: Manifest): Error[] {
  const errs: Error[] = [];

  if (!manifest.schemaVersion) {
    errs.push(new Error('missing schemaVersion'));
  }

  if (!manifest.modules || manifest.modules.length === 0) {
    errs.push(new Error('no modules found in manifest'));
  }

  if (manifest.modules) {
    for (let i = 0; i < manifest.modules.length; i++) {
      validateModule(manifest.modules[i], i, errs);
    }
  }

  return errs;
}

function validateModule(module: Manifest['modules'][number], i: number, errs: Error[]): void {
  if (!module.path) {
    errs.push(new Error(`module ${i}: missing path`));
  }
  if (!module.kind) {
    errs.push(new Error(`module ${i}: missing kind`));
  }

  if (module.declarations) {
    for (let j = 0; j < module.declarations.length; j++) {
      if (!module.declarations[j].name) {
        errs.push(new Error(`module ${i}, declaration ${j}: missing name`));
      }
    }
  }
}

export async function validateFile(path: string): Promise<{ manifest: Manifest; errors: Error[] }> {
  const manifest = await parseManifest(path);
  const errors = validate(manifest);
  return { manifest, errors };
}
