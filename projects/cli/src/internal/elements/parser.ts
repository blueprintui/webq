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
    for (let moduleIdx = 0; moduleIdx < manifest.modules.length; moduleIdx++) {
      validateModule(manifest.modules[moduleIdx], moduleIdx, errs);
    }
  }

  return errs;
}

function validateModule(module: Manifest['modules'][number], moduleIdx: number, errs: Error[]): void {
  if (!module.path) {
    errs.push(new Error(`module ${moduleIdx}: missing path`));
  }
  if (!module.kind) {
    errs.push(new Error(`module ${moduleIdx}: missing kind`));
  }

  if (module.declarations) {
    for (let declIdx = 0; declIdx < module.declarations.length; declIdx++) {
      if (!module.declarations[declIdx].name) {
        errs.push(new Error(`module ${moduleIdx}, declaration ${declIdx}: missing name`));
      }
    }
  }
}

export async function validateFile(path: string): Promise<{ manifest: Manifest; errors: Error[] }> {
  const manifest = await parseManifest(path);
  const errors = validate(manifest);
  return { manifest, errors };
}
