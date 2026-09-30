import fs from 'node:fs';
import path from 'node:path';

// Star / language / license metadata for github.com entries, fetched from the
// GitHub API at build time. Deliberately NOT stored in data.json (it would go
// stale there). A per-repo cache file survives offline or rate-limited builds,
// and any fetch failure just hides the meta row on the card — never breaks
// the build. Pass GITHUB_TOKEN (the deploy workflow does) for a comfortable
// rate limit; unauthenticated builds work too.
export interface RepoMeta {
  stars?: number;
  language?: string;
  license?: string;
}

interface CacheEntry {
  meta: RepoMeta;
  ts: number;
}

const CACHE_FILE = path.resolve(process.cwd(), 'github-meta.json');
const CACHE_TTL = 7 * 24 * 3600 * 1000;

let cache: Record<string, CacheEntry> = {};
try {
  const parsed = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  if (parsed && typeof parsed === 'object' && parsed.repos) cache = parsed.repos;
} catch {
  /* no cache yet */
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ repos: cache }, null, 2));
  } catch {
    /* read-only fs: cache stays in memory for this build */
  }
}

// owner/repo slug from a github.com URL; null for non-repo pages
// (e.g. github.com/features/copilot).
export function repoSlug(url: string): string | null {
  const m = url.match(/^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+)/);
  if (!m) return null;
  const reserved = new Set([
    'features', 'topics', 'collections', 'trending', 'orgs', 'apps',
    'marketplace', 'explore', 'settings', 'sponsors',
  ]);
  if (reserved.has(m[1])) return null;
  return `${m[1]}/${m[2].replace(/\.git$/, '')}`;
}

const inflight = new Map<string, Promise<RepoMeta | undefined>>();

async function fetchRepo(slug: string): Promise<RepoMeta | undefined> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'awesome-ai-tools-site',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const res = await fetch(`https://api.github.com/repos/${slug}`, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return undefined;
    const j: any = await res.json();
    return {
      stars: typeof j.stargazers_count === 'number' ? j.stargazers_count : undefined,
      language: typeof j.language === 'string' ? j.language : undefined,
      license:
        j.license && j.license.spdx_id && j.license.spdx_id !== 'NOASSERTION'
          ? j.license.spdx_id
          : undefined,
    };
  } catch {
    return undefined; // offline / rate limited: this repo just has no meta
  }
}

function repoMetaFor(url: string): Promise<RepoMeta | undefined> {
  const slug = repoSlug(url);
  if (!slug) return Promise.resolve(undefined);
  const cached = cache[slug];
  if (cached && Date.now() - cached.ts < CACHE_TTL) return Promise.resolve(cached.meta);
  let p = inflight.get(slug);
  if (!p) {
    p = fetchRepo(slug).then((meta) => {
      if (meta) {
        cache[slug] = { meta, ts: Date.now() };
        saveCache();
      }
      inflight.delete(slug);
      return meta;
    });
    inflight.set(slug, p);
  }
  return p;
}

// Call once per page's card list in frontmatter; returns url -> meta.
export async function loadRepoMeta(urls: string[]): Promise<Map<string, RepoMeta>> {
  const unique = [...new Set(urls)];
  await Promise.all(unique.map((url) => repoMetaFor(url)));
  return new Map(
    unique
      .map((url) => {
        const slug = repoSlug(url);
        return slug && cache[slug] ? [url, cache[slug].meta] as const : null;
      })
      .filter((pair): pair is [string, RepoMeta] => pair !== null),
  );
}
