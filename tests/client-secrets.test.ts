import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const SKIPPED_DIRS = new Set(['node_modules', '.next', '.git', 'test-results', 'playwright-report', 'tests', 'e2e']);
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.mts'];

function sourceFiles(dir: string = ROOT): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      return SKIPPED_DIRS.has(entry) ? [] : sourceFiles(fullPath);
    }
    return SOURCE_EXTENSIONS.some((ext) => entry.endsWith(ext)) ? [fullPath] : [];
  });
}

function resolveImport(specifier: string, importer: string): string | null {
  const base = specifier.startsWith('@/')
    ? join(ROOT, specifier.slice(2))
    : specifier.startsWith('.')
      ? resolve(dirname(importer), specifier)
      : null;

  if (!base) {
    return null;
  }

  const candidates = [
    ...SOURCE_EXTENSIONS.map((ext) => `${base}${ext}`),
    ...SOURCE_EXTENSIONS.map((ext) => join(base, `index${ext}`)),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

/** Every module the browser bundle can reach from a `'use client'` entrypoint. */
function clientModuleGraph(): string[] {
  const entrypoints = sourceFiles().filter((file) =>
    /^\s*['"]use client['"]/.test(readFileSync(file, 'utf8')),
  );

  const visited = new Set<string>();
  const queue = [...entrypoints];

  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (visited.has(file)) {
      continue;
    }
    visited.add(file);

    const contents = readFileSync(file, 'utf8');
    for (const match of contents.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const resolved = resolveImport(match[1] as string, file);
      if (resolved && !visited.has(resolved)) {
        queue.push(resolved);
      }
    }
  }

  return [...visited];
}

describe('client bundle secrecy', () => {
  it('has no public twin of the partner key or webhook secret anywhere', () => {
    const offenders = sourceFiles().filter((file) =>
      /NEXT_PUBLIC_API_KEY|NEXT_PUBLIC_WEBHOOK_SECRET/.test(readFileSync(file, 'utf8')),
    );

    expect(offenders.map((file) => relative(ROOT, file))).toEqual([]);
  });

  it('reads no environment variable from any module reachable by the browser', () => {
    const graph = clientModuleGraph();
    expect(graph.length).toBeGreaterThan(0);

    const offenders = graph.filter((file) => /process\.env/.test(readFileSync(file, 'utf8')));

    expect(offenders.map((file) => relative(ROOT, file))).toEqual([]);
  });

  it('sends no Authorization header from the browser client', () => {
    const client = readFileSync(join(ROOT, 'lib/api.ts'), 'utf8');

    expect(client).not.toMatch(/Authorization/i);
    expect(client).not.toMatch(/Bearer/);
  });
});
