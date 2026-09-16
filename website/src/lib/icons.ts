import fs from 'node:fs';
import path from 'node:path';

// Icons are downloaded by scripts/fetch-icons.sh into public/icons/<id>.<ext>.
// Prefer the local copy; fall back to the remote URL when it wasn't fetched.
let localIconFiles: Map<string, string>;
try {
  const dir = path.resolve(process.cwd(), 'public/icons');
  localIconFiles = new Map(
    fs
      .readdirSync(dir)
      .filter((f) => /\.(png|svg)$/.test(f))
      .map((f) => [f.replace(/\.(png|svg)$/, ''), f]),
  );
} catch {
  localIconFiles = new Map();
}

export function resolveIcon(
  tool: { id: string; image?: string },
  base: string,
): string | undefined {
  const file = localIconFiles.get(tool.id);
  return file ? `${base}icons/${file}` : tool.image;
}
