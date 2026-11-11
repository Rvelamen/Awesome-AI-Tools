import data from '../../showcase.json';

// One AI-generated work, imported from fengyiqicoder/awesome-fable-5.2 (CC0).
// Separate collection from the tool/project catalog in data.json.
export interface ShowcaseEntry {
  id: string;
  title: string;
  description: string;
  url: string;
  author?: string;
  post?: string;
  likes?: number;
  category: string;
  preview?: string; // public path relative to base, e.g. showcase/gifs/001.gif
}

export const showcaseEntries = data as unknown as ShowcaseEntry[];

// Category names in upstream (first-seen) order, with counts.
export function showcaseSections(): [string, ShowcaseEntry[]][] {
  const groups = new Map<string, ShowcaseEntry[]>();
  for (const entry of showcaseEntries) {
    const list = groups.get(entry.category) ?? [];
    list.push(entry);
    groups.set(entry.category, list);
  }
  return [...groups.entries()];
}
