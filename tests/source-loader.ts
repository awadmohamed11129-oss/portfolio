import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';

export const sourceRoot = path.resolve(process.env.QA_SOURCE_ROOT || process.cwd());

// Load actual TS/TSX from the measured source tree, without modifying app routes.
// The collection fixture replaces only framework Link/Image wrappers with HTML;
// its report therefore claims SSR collection/layout coverage, not hydration.
export function sourceLoader() {
  const cache = new Map<string, { exports: Record<string, unknown> }>();
  const css: string[] = [];
  const nativeRequire = createRequire(path.join(process.cwd(), 'package.json'));
  function load(relative: string): Record<string, unknown> {
    const candidate = path.resolve(sourceRoot, relative);
    const file = ['', '.ts', '.tsx', '.js', '/index.ts', '/index.tsx'].map(ext => candidate + ext).find(existsSync);
    if (!file) throw new Error(`Source fixture cannot resolve ${relative}`);
    if (cache.has(file)) return cache.get(file)!.exports;
    const loadedModule = { exports: {} as Record<string, unknown> };
    cache.set(file, loadedModule);
    const source = readFileSync(file, 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText;
    const resolve = (id: string): unknown => {
      if (id.endsWith('.css')) {
        const cssFile = path.resolve(path.dirname(file), id);
        css.push(readFileSync(cssFile, 'utf8'));
        return { __esModule: true, default: new Proxy({}, { get: (_target, key) => String(key) }) };
      }
      if (id === 'next/link') return { __esModule: true, default: ({ children, ...props }: React.ComponentProps<'a'>) => React.createElement('a', props, children) };
      if (id === 'next/image') return { __esModule: true, default: (props: React.ComponentProps<'img'> & { priority?: boolean; fill?: boolean }) => {
        const { priority, fill, ...htmlProps } = props;
        void priority; void fill;
        return React.createElement('img', htmlProps);
      } };
      if (id.startsWith('@/')) return load(id.slice(2));
      if (id.startsWith('.')) return load(path.relative(sourceRoot, path.resolve(path.dirname(file), id)));
      return nativeRequire(id);
    };
    new Function('require', 'module', 'exports', compiled)(resolve, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  return { load, css };
}
