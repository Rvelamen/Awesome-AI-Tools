import fs from 'node:fs';
import path from 'node:path';

// Homepage screenshots are captured by scripts/fetch-shots.mjs into
// public/shots/<id>.jpg (committed to the repo). Prefer the local copy;
// fall back to the on-demand mshots service for tools without one.
let localShotIds: Set<string>;
try {
  const dir = path.resolve(process.cwd(), 'public/shots');
  localShotIds = new Set(
    fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.jpg'))
      .map((f) => f.slice(0, -4)),
  );
} catch {
  localShotIds = new Set();
}

export function resolveShot(tool: { id: string; url: string }, base: string): string {
  return localShotIds.has(tool.id)
    ? `${base}shots/${tool.id}.jpg`
    : `https://s0.wp.com/mshots/v1/${encodeURIComponent(tool.url)}?w=480`;
}
