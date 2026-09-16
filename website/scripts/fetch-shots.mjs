// Batch-screenshot every tool's homepage into public/shots/<id>.jpg using a
// real browser (Playwright/Chromium). Idempotent: only missing files are
// captured. Run after new tools are added to data.json:
//   npm run shots
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const siteDir = path.resolve(import.meta.dirname, '..');
const tools = JSON.parse(fs.readFileSync(path.join(siteDir, 'data.json'), 'utf8'));
const outDir = path.join(siteDir, 'public/shots');
fs.mkdirSync(outDir, { recursive: true });

const todo = tools.filter((t) => !fs.existsSync(path.join(outDir, `${t.id}.jpg`)));
console.log(`shots to take: ${todo.length} / ${tools.length}`);
if (!todo.length) process.exit(0);

const CONCURRENCY = Number(process.env.CONC) || 3;
const browser = await chromium.launch();
let cursor = 0;
let ok = 0;
let failed = 0;

async function worker() {
  while (cursor < todo.length) {
    const tool = todo[cursor++];
    // fresh context per site: reusing one context for dozens of heavy SPAs
    // degrades the browser and later navigations start timing out
    const ctx = await browser.newContext({
      viewport: { width: 960, height: 570 },
      locale: 'zh-CN',
      ignoreHTTPSErrors: true, // many catalog sites have expired/self-signed certs
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    });
    try {
      const page = await ctx.newPage();
      await page.goto(tool.url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(2500);
      await page.screenshot({
        path: path.join(outDir, `${tool.id}.jpg`),
        type: 'jpeg',
        quality: 50,
      });
      ok++;
    } catch {
      failed++;
    } finally {
      await ctx.close();
    }
    const done = ok + failed;
    if (done % 50 === 0) console.log(`progress: ${done}/${todo.length} (${failed} failed)`);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
await browser.close();
console.log(`done: ${ok} captured, ${failed} failed (failures fall back to mshots at runtime)`);
