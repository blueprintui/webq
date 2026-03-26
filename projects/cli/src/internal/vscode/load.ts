import type { Manifest } from '../elements/types.js';
import type { CustomAttributesFile, CustomAttribute } from '../attributes/types.js';
import type { CustomStylesFile, CSSCustomProperty } from '../styles/types.js';
import { resolve } from './resolver.js';
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

    let refs;
    try {
      refs = await resolve(dir);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      continue;
    }

    for (const ref of refs) {
      for (const htmlPath of ref.htmlDataPaths) {
        try {
          const hcd = await parseHTMLCustomData(htmlPath);
          const { manifest, attributes: caf } = convertHTML(hcd);
          if (manifest) result.manifests.push(manifest);
          if (caf) allAttrs.push(...caf.attributes);
        } catch (err) {
          process.stderr.write(`warning: skipping ${htmlPath}: ${err instanceof Error ? err.message : String(err)}\n`);
          continue;
        }
      }

      for (const cssPath of ref.cssDataPaths) {
        try {
          const ccd = await parseCSSCustomData(cssPath);
          const csf = convertCSS(ccd);
          if (csf) allStyles.push(...csf.cssCustomProperties);
        } catch (err) {
          process.stderr.write(`warning: skipping ${cssPath}: ${err instanceof Error ? err.message : String(err)}\n`);
          continue;
        }
      }
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
