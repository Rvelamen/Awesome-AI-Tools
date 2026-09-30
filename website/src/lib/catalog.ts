import data from '../../data.json';

// One catalog entry. `kind` is absent for tool entries (the vast majority);
// open-source projects set kind: "project" and use their own category
// namespace (Agent 技能 / CLI 工具 / ...), rendered as a separate section.
export interface CatalogEntry {
  url: string;
  title: string;
  type?: string;
  description: string;
  image?: string;
  category: string[];
  id: string;
  kind?: string;
}

export const entries = data as unknown as CatalogEntry[];

export const isProject = (entry: CatalogEntry) => entry.kind === 'project';

export const tools = entries.filter((entry) => !isProject(entry));
export const projects = entries.filter(isProject);

// [name, count] pairs sorted by count desc, for the sidebar and overviews.
export function catCounts(list: CatalogEntry[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const entry of list) {
    for (const cat of entry.category) counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}
