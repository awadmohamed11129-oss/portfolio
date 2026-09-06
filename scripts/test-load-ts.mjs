import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

// CPU-only execution of production TypeScript, retaining its real dependency
// graph. Overrides are reserved for browser/renderer boundaries in fixtures.
export function loadTypeScript(filename, overrides = {}, globals = {}, cache = new Map(), transform = (_filename, source) => source) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename).exports;
  const loaded = { exports: {} };
  cache.set(filename, loaded);
  const require = createRequire(filename);
  const localRequire = name => {
    if (name in overrides) return overrides[name];
    if (name.startsWith('.')) {
      const base = path.resolve(path.dirname(filename), name);
      const resolved = [base, `${base}.ts`, `${base}.js`, path.join(base, 'index.ts')].find(file => existsSync(file));
      if (resolved && /\.[tj]s$/.test(resolved)) return loadTypeScript(resolved, overrides, globals, cache, transform);
    }
    return require(name);
  };
  const source = ts.transpileModule(transform(filename, readFileSync(filename, 'utf8')), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(`(function(require,module,exports){${source}\n})`, Object.assign(globals, { console }), { filename })(localRequire, loaded, loaded.exports);
  return loaded.exports;
}
