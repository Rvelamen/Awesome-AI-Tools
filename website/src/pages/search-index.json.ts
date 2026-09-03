import tools from '../../data.json';
import { resolveIcon } from '../lib/icons';
import { resolveShot } from '../lib/shots';

// Static JSON consumed lazily by the client-side search (see Search.astro).
export function GET() {
  const base = import.meta.env.BASE_URL;
  const index = tools.map((tool) => ({
    title: tool.title,
    description: tool.description,
    url: tool.url,
    image: resolveIcon(tool, base),
    shot: resolveShot(tool, base),
    type: tool.type,
    category: tool.category,
  }));
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
