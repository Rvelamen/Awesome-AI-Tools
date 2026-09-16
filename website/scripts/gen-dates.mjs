// Generate dates.json: map each catalog entry id -> unix timestamp of the
// commit that last touched its "id" line in ../data.json (i.e. when it was
// added/updated). Used by the homepage "最近新增" section. Requires full git
// history (actions/checkout fetch-depth: 0); degrades to an empty map.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const siteDir = path.resolve(import.meta.dirname, '..');
const repoRoot = path.resolve(siteDir, '..');

let dates = {};
try {
  const blame = execSync('git blame --line-porcelain -- data.json', {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  let ts = 0;
  for (const line of blame.split('\n')) {
    if (line.startsWith('author-time ')) {
      ts = Number(line.slice(12));
    } else if (line.startsWith('\t')) {
      const m = line.match(/"id":\s*"([^"]+)"/);
      if (m && ts) dates[m[1]] = ts;
    }
  }
} catch (e) {
  console.warn('gen-dates: git blame unavailable, "最近新增" will be hidden:', e.message);
}

fs.writeFileSync(path.join(siteDir, 'dates.json'), JSON.stringify(dates));
console.log(`dates: ${Object.keys(dates).length} entries`);
