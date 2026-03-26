import { RuleTester } from 'eslint';
import * as htmlParser from '@html-eslint/parser';
import path from 'node:path';

export const webqPath = path.resolve(import.meta.dirname, '.');
export const webqOption = { path: webqPath };

export const ruleTester = new RuleTester({
  languageOptions: {
    parser: htmlParser
  }
});
