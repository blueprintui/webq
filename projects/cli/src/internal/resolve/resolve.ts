import { stat } from 'fs/promises';
import { join } from 'path';

export async function resolveFile(dir: string, filename: string): Promise<string> {
  try {
    const info = await stat(dir);
    if (!info.isDirectory()) {
      throw new Error(`path "${dir}" is not a directory`);
    }
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return '';
    throw err;
  }

  const candidate = join(dir, filename);
  try {
    await stat(candidate);
    return candidate;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return '';
    throw err;
  }
}
