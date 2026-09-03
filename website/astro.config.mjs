import { defineConfig } from 'astro/config';

// SITE_URL / SITE_BASE are set by the deploy workflow for GitHub Pages.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://rvelamen.github.io',
  base: process.env.SITE_BASE ?? '/',
  output: 'static',
});
