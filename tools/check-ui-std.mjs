// UI-STD lock: screens (src/app/modules) must not hard-code size of buttons, inputs, tables or page titles.
// Ratchet: a file may keep its baseline count but never exceed it; new files get 0. Update baseline with --write after cleaning up.
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = 'src/app/modules';
const BASELINE = 'tools/ui-std-baseline.json';
const SELECTOR = /btn|button|\binput\b|\bselect\b|\btable\b|\bth\b|\btd\b|\btr\b|\brow\b|page-title|\bh1\b|\bh2\b|toolbar|action/i;
const PROP = /^\s*(font-size|height|min-height|padding)\s*:\s*[^;]*\d+(\.\d+)?(px|rem|em)\b/;

function scssFiles(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (n === 'node_modules' || n === '.git') return [];
    return statSync(p).isDirectory() ? scssFiles(p) : p.endsWith('.scss') ? [p] : [];
  });
}

function count(file) {
  const stack = [];
  let hits = 0;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const code = line.replace(/\/\/.*$/, '');
    if (PROP.test(code) && stack.some((s) => SELECTOR.test(s))) hits++;
    if (/\{\s*$/.test(code)) stack.push(code.replace(/\{\s*$/, ''));
    if (/^\s*\}/.test(code)) stack.pop();
  }
  return hits;
}

const current = {};
for (const f of scssFiles(ROOT)) {
  const n = count(f);
  if (n) current[relative('.', f).split(sep).join('/')] = n;
}

if (process.argv.includes('--write')) {
  writeFileSync(BASELINE, JSON.stringify(current, null, 2) + '\n');
  console.log(`baseline written: ${Object.keys(current).length} files`);
  process.exit(0);
}

const base = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : {};
const bad = Object.entries(current).filter(([f, n]) => n > (base[f] ?? 0));
if (bad.length) {
  console.error('UI-STD: hard-coded size on button/input/table/title selectors (use theme tokens or shared components):');
  for (const [f, n] of bad) console.error(`  ${f}: ${n} (allowed ${base[f] ?? 0})`);
  process.exit(1);
}
console.log('UI-STD check OK');
