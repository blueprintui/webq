import type { Manifest } from '../elements/types.js';
import type { CustomAttributesFile, CustomAttribute } from '../attributes/types.js';
import type { CustomStylesFile, CSSCustomProperty } from '../styles/types.js';
import { resolve, type PackageJSONRef } from './resolver.js';
import { parseHTMLCustomData, parseCSSCustomData } from './parser.js';
import { convertHTML, convertCSS } from './convert.js';

export interface VSCodeResult {
  manifests: Manifest[];
  attributes?: CustomAttributesFile;
  styles?: CustomStylesFile;
}

export async function load(pathsStr: string): Promise<VSCodeResult> {
  const paths = pathsStr.split(',');
  const result: VSCodeResult = { manifests: [] };
  const allAttrs: CustomAttribute[] = [];
  const allStyles: CSSCustomProperty[] = [];

  for (let dir of paths) {
    dir = dir.trim();
    if (!dir) continue;

    const refs = await resolveDir(dir);
    if (!refs) continue;

    for (const ref of refs) {
      await processRef(ref, result, allAttrs, allStyles);
    }
  }

  if (allAttrs.length > 0) {
    result.attributes = { schemaVersion: '1.0.0', attributes: allAttrs };
  }
  if (allStyles.length > 0) {
    result.styles = { schemaVersion: '1.0.0', cssCustomProperties: allStyles };
  }

  return result;
}

async function resolveDir(dir: string): Promise<PackageJSONRef[] | undefined> {
  try {
    return await resolve(dir);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    return undefined;
  }
}

async function processRef(
  ref: PackageJSONRef,
  result: VSCodeResult,
  allAttrs: CustomAttribute[],
  allStyles: CSSCustomProperty[]
): Promise<void> {
  for (const htmlPath of ref.htmlDataPaths) {
    await processHTMLPath(htmlPath, result, allAttrs);
  }
  for (const cssPath of ref.cssDataPaths) {
    await processCSSPath(cssPath, allStyles);
  }
}

async function processHTMLPath(htmlPath: string, result: VSCodeResult, allAttrs: CustomAttribute[]): Promise<void> {
  try {
    const hcd = await parseHTMLCustomData(htmlPath);
    const { manifest, attributes: caf } = convertHTML(hcd);
    if (manifest) result.manifests.push(manifest);
    if (caf) allAttrs.push(...caf.attributes);
  } catch (err) {
    process.stderr.write(`warning: skipping ${htmlPath}: ${err instanceof Error ? err.message : String(err)}\n`);
  }
}

async function processCSSPath(cssPath: string, allStyles: CSSCustomProperty[]): Promise<void> {
  try {
    const ccd = await parseCSSCustomData(cssPath);
    const csf = convertCSS(ccd);
    if (csf) allStyles.push(...csf.cssCustomProperties);
  } catch (err) {
    process.stderr.write(`warning: skipping ${cssPath}: ${err instanceof Error ? err.message : String(err)}\n`);
  }
}
