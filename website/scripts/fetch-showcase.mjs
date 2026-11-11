// Import AI-generated works from fengyiqicoder/awesome-fable-5.2 (CC0).
// Rewrites the root showcase.json and downloads missing GIF previews into
// website/public/showcase/gifs/. Run from website/: node scripts/fetch-showcase.mjs
import fs from 'node:fs';
import path from 'node:path';

const UPSTREAM =
  'https://raw.githubusercontent.com/fengyiqicoder/awesome-fable-5.2/main';
const root = path.resolve(import.meta.dirname, '../..');
const gifDir = path.join(import.meta.dirname, '../public/showcase/gifs');
fs.mkdirSync(gifDir, { recursive: true });

const works = await fetch(`${UPSTREAM}/data/works.json`).then((r) => {
  if (!r.ok) throw new Error(`works.json: HTTP ${r.status}`);
  return r.json();
});

const showcase = works.map((w) => ({
  id: `fable-${String(w.id).padStart(3, '0')}`,
  title: w.title_zh || w.title,
  description: w.description_zh || w.description,
  url: w.url || w.post,
  author: w.author,
  post: w.post,
  likes: w.likes,
  category: w.section,
  preview: w.preview?.startsWith('assets/') ? `showcase/${w.preview.replace('assets/', '')}` : '',
}));
fs.writeFileSync(
  path.join(root, 'showcase.json'),
  JSON.stringify(showcase, null, 2) + '\n',
);
console.log(`showcase.json: ${showcase.length} works`);

const gifs = works.map((w) => w.preview).filter(Boolean);
let downloaded = 0;
for (const preview of gifs) {
  const dest = path.join(gifDir, path.basename(preview));
  if (fs.existsSync(dest)) continue;
  const res = await fetch(`${UPSTREAM}/${preview}`);
  if (!res.ok) {
    console.warn(`skip ${preview}: HTTP ${res.status}`);
    continue;
  }
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  downloaded++;
}
console.log(`gifs: ${downloaded} downloaded, ${gifs.length - downloaded} already present or skipped`);
