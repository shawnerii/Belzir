import path from 'path';

export function resolveProjectRoot(fromDir: string): string {
  const srcDir = path.resolve(fromDir, '..');
  const parent = path.resolve(srcDir, '..');

  if (path.basename(parent) === 'dist') {
    return path.resolve(parent, '..');
  }

  return parent;
}
