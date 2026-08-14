#!/usr/bin/env node
// Expo emits web assets under dist/assets/node_modules/..., but Cloudflare Pages
// (and several other static hosts) silently skip any path containing
// node_modules, so every icon font 404s to the SPA fallback. Relocate them to
// dist/assets/vendor/ and repoint the references before deploying.
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const FROM_DIR = path.join(DIST, 'assets', 'node_modules');
const TO_DIR = path.join(DIST, 'assets', 'vendor');
const FROM_REF = '/assets/node_modules/';
const TO_REF = '/assets/vendor/';
const REWRITE_EXTS = new Set(['.js', '.html', '.json', '.css', '.map']);

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

if (!fs.existsSync(DIST)) {
  console.error('dist/ not found - run `npx expo export -p web` first.');
  process.exit(1);
}

if (fs.existsSync(FROM_DIR)) {
  fs.rmSync(TO_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(TO_DIR), { recursive: true });
  // Copy-then-remove rather than rename: Windows throws EPERM renaming a
  // directory tree that the exporter has only just finished writing.
  fs.cpSync(FROM_DIR, TO_DIR, { recursive: true });
  fs.rmSync(FROM_DIR, { recursive: true, force: true });
  console.log(`Moved ${path.relative(DIST, FROM_DIR)} -> ${path.relative(DIST, TO_DIR)}`);
} else {
  console.log('No assets/node_modules directory - nothing to move.');
}

let rewritten = 0;
for (const file of walk(DIST)) {
  if (!REWRITE_EXTS.has(path.extname(file))) continue;
  const before = fs.readFileSync(file, 'utf8');
  if (!before.includes(FROM_REF)) continue;
  fs.writeFileSync(file, before.split(FROM_REF).join(TO_REF));
  rewritten += 1;
  console.log(`Rewrote refs in ${path.relative(DIST, file)}`);
}

const leftover = walk(DIST).filter((f) => f.includes(`${path.sep}node_modules${path.sep}`));
if (leftover.length) {
  console.error(`FAILED: ${leftover.length} file(s) still under a node_modules path.`);
  process.exit(1);
}

console.log(`Done. ${rewritten} file(s) rewritten, 0 assets left under node_modules.`);
