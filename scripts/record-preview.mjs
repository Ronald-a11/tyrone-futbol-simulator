#!/usr/bin/env node
/**
 * Record a downloadable preview video of the Prem career + live match.
 * Output: public/tyrone-preview.webm
 */
import { mkdirSync, copyFileSync, readFileSync, readdirSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const BASE = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const OUT_DIR = join(process.cwd(), "public");
const TMP = join(process.cwd(), "screenshots", "preview-record");
const SAVE_PATH = join(OUT_DIR, "climb-save.json");
const FINAL = join(OUT_DIR, "tyrone-preview.webm");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function clickText(page, re, timeout = 4000) {
  const btn = page.getByRole("button", { name: re }).first();
  await btn.waitFor({ state: "visible", timeout }).catch(() => null);
  if (await btn.isVisible().catch(() => false)) {
    await btn.click({ force: true }).catch(() => {});
    return true;
  }
  return false;
}

async function drainOverlays(page, max = 18) {
  for (let i = 0; i < max; i++) {
    const clicked =
      (await clickText(page, /^Continue$/i, 800)) ||
      (await clickText(page, /^Get started/i, 600)) ||
      (await clickText(page, /Set Ticket Prices/i, 600)) ||
      (await clickText(page, /Confirm Bonus/i, 600)) ||
      (await clickText(page, /Choose Shirt Sponsor/i, 600)) ||
      (await clickText(page, /^AIA /i, 600)) ||
      (await clickText(page, /20 %/i, 600));
    if (!clicked) break;
    await sleep(250);
  }
}

async function main() {
  if (!existsSync(SAVE_PATH)) throw new Error("Missing public/climb-save.json");
  const save = JSON.parse(readFileSync(SAVE_PATH, "utf8"));
  mkdirSync(TMP, { recursive: true });
  for (const f of readdirSync(TMP)) {
    rmSync(join(TMP, f), { recursive: true, force: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 420, height: 860 },
    deviceScaleFactor: 2,
    recordVideo: { dir: TMP, size: { width: 420, height: 860 } },
  });
  const page = await context.newPage();

  await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
  await sleep(800);
  await clickText(page, /^Continue$/i, 5000);
  await sleep(400);
  await clickText(page, /Get started/i, 3000);
  await sleep(400);

  await page.evaluate((data) => {
    localStorage.setItem("tyrone-futbol-v1", JSON.stringify(data));
  }, save);
  await page.reload({ waitUntil: "networkidle" });
  await sleep(1000);
  await drainOverlays(page);

  /* History climb */
  await clickText(page, /^History$/i, 4000);
  await sleep(3500);
  await clickText(page, /^Back$/i, 3000);
  await sleep(600);

  /* Trophies */
  await clickText(page, /^Trophies/i, 3000);
  await sleep(2500);
  await clickText(page, /^Back$/i, 3000);
  await sleep(500);

  /* Watch match */
  const watch = await clickText(page, /Watch/i, 5000);
  if (!watch) {
    /* try Sim if watch missing */
    await clickText(page, /Friendly|Sim/i, 3000);
  }
  await sleep(800);

  await clickText(page, /Enter the pitch/i, 5000);
  await sleep(700);
  await clickText(page, /Confirm line-?ups/i, 5000);
  await sleep(700);
  await clickText(page, /Kick off/i, 5000);
  await sleep(500);

  /* close tactics if open */
  await clickText(page, /^Close$/i, 1500);
  await clickText(page, /3\s*[×x]/i, 3000);

  /* let the match roll */
  await sleep(22000);

  /* pause for a beat on the pitch */
  await clickText(page, /^Pause$/i, 2000);
  await sleep(2000);

  const video = page.video();
  await page.close();
  const rawPath = video ? await video.path() : null;
  await context.close();
  await browser.close();

  if (!rawPath || !existsSync(rawPath)) {
    throw new Error("Playwright did not write a video file");
  }
  copyFileSync(rawPath, FINAL);
  console.log(JSON.stringify({ ok: true, file: FINAL, season: save.season, tier: save.tier }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
